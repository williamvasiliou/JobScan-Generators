const quote = (string) => `"${string.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;
const join = (timeout) => timeout > 0 ? `join(${timeout})` : 'join()';
const write = (starts) => starts.length > 0 ? starts.map((args) => `start(new ProcessBuilder(${args.map(quote).join(', ')}));`).join('\n\t\t\t').concat('\n\n\t\t\twrite()') : 'write()';

export const read = (require, keys, context) => {
	const { cwd, searchprog, join, string, uint16, starts } = context;

	context.soffice = searchprog('libreoffice').replace(/soffice$/, 'soffice.bin');

	context.java = searchprog('java');
	context.javac = searchprog('javac');
	context.jar = join(context.soffice, '../classes/libreoffice.jar');

	context.config = require(join(cwd, 'config.json'));
	keys(context.config, ['port', 'IN', 'OUT', 'length', 'timeout', 'starts']);

	context.port = uint16(context.config.port);
	context.URL = `uno:socket,host=localhost,port=${context.port};urp;StarOffice.ServiceManager`;

	context.IN = string(context.config.IN) || 'resume.odt';
	context.OUT = string(context.config.OUT) || 'resume.pdf';

	if (!(context.config.length instanceof Array) || context.config.length.length !== 2) {
		throw new TypeError('config: "length" is not an Array(2)');
	}
	context.length = context.config.length.map(uint16);
	if (context.length.find((length) => length <= 0) !== undefined) {
		throw new RangeError('config: "length" should be > 0');
	}

	context.timeout = uint16(context.config.timeout);
	context.starts = starts(context.config.starts);

	return context;
};

export const log = (context) => ['soffice', 'java', 'javac', 'jar', 'port', 'URL', 'IN', 'OUT', 'length', 'timeout', 'starts'].forEach((key) => key === 'starts' ? context[key].forEach((start, i) => console.log(`starts[${i}] = ${start.join(' ')}`)) : console.log(`${key} = ${context[key]}`));

export const format = ({ URL, IN, OUT, length, timeout, starts }) =>
`import com.sun.star.awt.Rectangle;
import com.sun.star.awt.WindowAttribute;
import com.sun.star.awt.WindowClass;
import com.sun.star.awt.WindowDescriptor;
import com.sun.star.awt.XToolkit;
import com.sun.star.awt.XWindow;
import com.sun.star.awt.XWindowPeer;
import com.sun.star.beans.PropertyValue;
import com.sun.star.beans.XPropertySet;
import com.sun.star.bridge.XUnoUrlResolver;
import com.sun.star.container.XNameAccess;
import com.sun.star.frame.FrameSearchFlag;
import com.sun.star.frame.XComponentLoader;
import com.sun.star.frame.XFrame;
import com.sun.star.frame.XFrames;
import com.sun.star.frame.XFramesSupplier;
import com.sun.star.frame.XStorable;
import com.sun.star.lang.XComponent;
import com.sun.star.lang.XMultiComponentFactory;
import com.sun.star.text.XBookmarksSupplier;
import com.sun.star.text.XTextContent;
import com.sun.star.text.XTextRange;
import com.sun.star.uno.UnoRuntime;
import com.sun.star.uno.XComponentContext;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.IOException;
import java.lang.Exception;
import java.lang.InterruptedException;
import java.lang.Process;
import java.lang.ProcessBuilder;
import java.lang.Runnable;
import java.lang.StringBuilder;
import java.lang.Thread;
import java.util.LinkedHashSet;

public final class Main implements Runnable {
	public static final String URL = ${quote(URL)};

	public static final String IN = ${quote(IN)};
	public static final String OUT = ${quote(OUT)};

	public final String keywords;
	public boolean good;

	public Main(final String keywords) {
		this.keywords = keywords;
		this.good = false;
	}

	public static final void read(final LinkedHashSet<String> keywords) {
		new BufferedReader(new InputStreamReader(System.in)).lines().forEach(keyword -> keywords.add(keyword));
	}

	public static final String getBookmark(final LinkedHashSet<String> keywords) {
		final StringBuilder sb = new StringBuilder("");
		boolean rest = false;

		for (final String keyword : keywords) {
			if (rest) {
				sb.append(", ");
			}

			sb.append(keyword);
			rest = true;
		}

		return sb.toString();
	}

	public static final void start(final ProcessBuilder pb) throws IOException, InterruptedException {
		pb.redirectErrorStream(true);

		final Process p = pb.start();
		p.getOutputStream().close();

		final InputStream in = p.getInputStream();
		final byte[] b = new byte[${length.shift()}];
		while (in.read(b, 0, b.length) > 0) { }
		in.close();

		p.waitFor();
	}

	public static final void write() throws IOException {
		final FileInputStream in = new FileInputStream(OUT);
		final byte[] b = new byte[${length.shift()}];
		int r = in.read(b, 0, b.length);

		while (r > 0) {
			System.out.write(b, 0, r);
			r = in.read(b, 0, b.length);
		}

		in.close();

		System.out.flush();
		System.out.close();
	}

	public final void run() {
		try {
			XComponentContext xLocalContext = com.sun.star.comp.helper.Bootstrap.createInitialComponentContext(null);
			XMultiComponentFactory xLocalServiceManager = xLocalContext.getServiceManager();

			Object urlResolver = xLocalServiceManager.createInstanceWithContext("com.sun.star.bridge.UnoUrlResolver", xLocalContext);
			XUnoUrlResolver xUrlResolver = UnoRuntime.queryInterface(XUnoUrlResolver.class, urlResolver);

			Object serviceManager = xUrlResolver.resolve(URL);
			XMultiComponentFactory xMCF = UnoRuntime.queryInterface(XMultiComponentFactory.class, serviceManager);
			XPropertySet xPropertySet = UnoRuntime.queryInterface(XPropertySet.class, xMCF);
			Object oDefaultContext = xPropertySet.getPropertyValue("DefaultContext");
			XComponentContext xContext = UnoRuntime.queryInterface(XComponentContext.class, oDefaultContext);
			Object desktop = xMCF.createInstanceWithContext("com.sun.star.frame.Desktop", xContext);

			WindowDescriptor aDescriptor = new WindowDescriptor();
			aDescriptor.Type = WindowClass.TOP;
			aDescriptor.WindowServiceName = "window";
			aDescriptor.Parent = null;
			aDescriptor.ParentIndex = -1;
			aDescriptor.Bounds = new Rectangle(0, 0, 0, 0);
			aDescriptor.WindowAttributes =
				WindowAttribute.BORDER |
				WindowAttribute.CLOSEABLE |
				WindowAttribute.MOVEABLE |
				WindowAttribute.SIZEABLE;

			XToolkit xToolkit = UnoRuntime.queryInterface(XToolkit.class, xMCF.createInstanceWithContext("com.sun.star.awt.Toolkit", xContext));
			XWindowPeer xPeer = xToolkit.createWindow(aDescriptor);
			XWindow xWindow = UnoRuntime.queryInterface(XWindow.class, xPeer);

			XFrame xFrame = UnoRuntime.queryInterface(XFrame.class, xMCF.createInstanceWithContext("com.sun.star.frame.Frame", xContext));
			xFrame.initialize(xWindow);

			XFramesSupplier xTreeRoot = UnoRuntime.queryInterface(XFramesSupplier.class, desktop);
			XFrames xChildContainer = xTreeRoot.getFrames();
			xChildContainer.append(xFrame);
			xFrame.setName("newly created 1");

			XComponentLoader xComponentLoader = UnoRuntime.queryInterface(XComponentLoader.class, desktop);
			XComponent xTemplateComponent = xComponentLoader.loadComponentFromURL("file:///" + new File(IN).getCanonicalPath().replace('\\\\', '/'), "newly created 1", FrameSearchFlag.CHILDREN, new PropertyValue[0]);
			xWindow.setVisible(false);

			XBookmarksSupplier xBookmarksSupplier = UnoRuntime.queryInterface(XBookmarksSupplier.class, xTemplateComponent);
			XNameAccess xNamedBookmarks = xBookmarksSupplier.getBookmarks();
			Object bookmark = xNamedBookmarks.getByName("Keywords");

			XTextContent xBookmarkContent = UnoRuntime.queryInterface(XTextContent.class, bookmark);
			XTextRange xBookmarkRange = xBookmarkContent.getAnchor();
			xBookmarkRange.setString(this.keywords);

			String outURL = "file:///" + new File(OUT).getCanonicalPath().replace('\\\\', '/');
			PropertyValue[] propertyValue = new PropertyValue[2];
			propertyValue[0] = new PropertyValue();
			propertyValue[0].Name = "FilterName";
			propertyValue[0].Value = "writer_pdf_Export";
			propertyValue[1] = new PropertyValue();
			propertyValue[1].Name = "URL";
			propertyValue[1].Value = outURL;

			XStorable xStorable = UnoRuntime.queryInterface(XStorable.class, xTemplateComponent);
			xStorable.storeToURL(outURL, propertyValue);

			xTemplateComponent.dispose();

			this.good = true;
		} catch (Exception e) {
			e.printStackTrace();
			System.exit(1);
		}
	}

	public static final void main(final String[] args) throws IOException, InterruptedException {
		final LinkedHashSet<String> keywords = new LinkedHashSet<String>();
		read(keywords);

		final Main main = new Main(getBookmark(keywords));
		final Thread thread = new Thread(main);
		thread.start();
		thread.${join(timeout)};

		if (main.good) {
			${write(starts)};
			System.exit(0);
		} else {
			System.exit(1);
		}
	}
}
`;

export const command = ({ cwd, file, basename, java, jar }) =>
`export const COMMAND = '${java}'
export const ARGS = ['-cp', '${cwd}:${jar}', '${basename(file, '.java')}']
export const OPTIONS = {
	cwd: '${cwd}',
}
`;

export const compile = ({ cwd, file, join, javac, jar }) => ({
	COMMAND: javac,
	ARGS: ['-cp', `${cwd}:${jar}`, join(cwd, file)],
});

export const serve = ({ soffice, URL }) => ({
	COMMAND: soffice,
	ARGS: [`--accept=${URL.slice(4)}`, '--nologo'],
});
