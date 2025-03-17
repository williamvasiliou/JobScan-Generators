#include <chrono>
#include <cstdlib>
#include <fstream>
#include <future>
#include <iostream>
#include <string>
#include <vector>

#include <sal/main.h>
#include <cppuhelper/bootstrap.hxx>
#include <rtl/bootstrap.hxx>

#include <osl/file.hxx>
#include <osl/process.h>
#include <rtl/process.h>

#include <com/sun/star/awt/Rectangle.hpp>
#include <com/sun/star/awt/WindowAttribute.hpp>
#include <com/sun/star/awt/WindowClass.hpp>
#include <com/sun/star/awt/WindowDescriptor.hpp>
#include <com/sun/star/awt/XToolkit.hpp>
#include <com/sun/star/awt/XWindow.hpp>
#include <com/sun/star/awt/XWindowPeer.hpp>
#include <com/sun/star/beans/PropertyValue.hpp>
#include <com/sun/star/beans/XPropertySet.hpp>
#include <com/sun/star/bridge/XUnoUrlResolver.hpp>
#include <com/sun/star/container/XNameAccess.hpp>
#include <com/sun/star/frame/FrameSearchFlag.hpp>
#include <com/sun/star/frame/XComponentLoader.hpp>
#include <com/sun/star/frame/XFrame.hpp>
#include <com/sun/star/frame/XFrames.hpp>
#include <com/sun/star/frame/XFramesSupplier.hpp>
#include <com/sun/star/frame/XStorable.hpp>
#include <com/sun/star/lang/XComponent.hpp>
#include <com/sun/star/lang/XMultiComponentFactory.hpp>
#include <com/sun/star/text/XBookmarksSupplier.hpp>
#include <com/sun/star/text/XTextContent.hpp>
#include <com/sun/star/text/XTextRange.hpp>

using namespace com::sun::star::awt;
using namespace com::sun::star::beans;
using namespace com::sun::star::bridge;
using namespace com::sun::star::container;
using namespace com::sun::star::frame;
using namespace com::sun::star::lang;
using namespace com::sun::star::text;
using namespace com::sun::star::uno;

using ::rtl::OUString;

// TODO edit port
static const OUString URL("uno:socket,host=localhost,port=;urp;StarOffice.ServiceManager");

// TODO optional: edit
static const OUString IN("resume.odt");
static const OUString OUT("resume.pdf");

void read(std::vector<std::string>& keywords) {
	std::string line;
	bool add = (bool) std::cin;
	char c = 0;

	while (add) {
		line.resize(0);
		while (std::cin.get(c)) {
			if (c == '\n') {
				break;
			}

			line += c;
		}

		add = (bool) std::cin;
		if (add) {
			for (auto& keyword : keywords) {
				if (keyword == line) {
					add = false;
					break;
				}
			}

			if (add) {
				keywords.push_back(line);
			} else {
				add = true;
			}
		}
	}
}

const std::string getBookmark(const std::vector<std::string>& keywords) {
	const size_t size = keywords.size();
	std::string bookmark;

	if (size > 0) {
		bookmark = keywords[0];

		for (size_t i = 1; i < size; ++i) {
			bookmark += ", " + keywords[i];
		}
	}

	return bookmark;
}

void start(const char *command) {
	system(command);
}

void write() {
	std::ifstream is(/* TODO */, std::ifstream::binary);

	if (is) {
		const size_t n = /* TODO */;
		char *s = new char [n] {};
		ssize_t nread = 0;

		while (is) {
			is.read(s, n);
			nread = is.gcount();

			if (nread > 0) {
				std::cout.write(s, nread);
			}
		}

		is.close();
		delete[] s;
	}

	std::cout.flush();
}

bool run(const OUString& keywords) {
	try {
		Reference<XComponentContext> xLocalContext(::cppu::defaultBootstrap_InitialComponentContext());
		Reference<XMultiComponentFactory> xLocalServiceManager(xLocalContext->getServiceManager());

		Reference<XInterface> urlResolver = xLocalServiceManager->createInstanceWithContext("com.sun.star.bridge.UnoUrlResolver", xLocalContext);
		Reference<XUnoUrlResolver> xUrlResolver(urlResolver, UNO_QUERY);

		Reference<XInterface> serviceManager(xUrlResolver->resolve(URL), UNO_QUERY_THROW);
		Reference<XMultiComponentFactory> xMCF(serviceManager, UNO_QUERY);
		Reference<XPropertySet> xPropertySet(serviceManager, UNO_QUERY);
		Any oDefaultContext = xPropertySet->getPropertyValue("DefaultContext");
		Reference<XComponentContext> xContext(oDefaultContext, UNO_QUERY_THROW);
		Reference<XInterface> desktop = xMCF->createInstanceWithContext("com.sun.star.frame.Desktop", xContext);

		WindowDescriptor aDescriptor(
			::css::awt::WindowClass_TOP,
			"window",
			NULL,
			-1,
			Rectangle(0, 0, 0, 0),
			WindowAttribute::BORDER |
			WindowAttribute::CLOSEABLE |
			WindowAttribute::MOVEABLE |
			WindowAttribute::SIZEABLE
		);

		Reference<XToolkit> xToolkit(xMCF->createInstanceWithContext("com.sun.star.awt.Toolkit", xContext), UNO_QUERY_THROW);
		Reference<XWindowPeer> xPeer = xToolkit->createWindow(aDescriptor);
		Reference<XWindow> xWindow(xPeer, UNO_QUERY);

		Reference<XFrame> xFrame(xMCF->createInstanceWithContext("com.sun.star.frame.Frame", xContext), UNO_QUERY_THROW);
		xFrame->initialize(xWindow);

		Reference<XFramesSupplier> xTreeRoot(desktop, UNO_QUERY);
		Reference<XFrames> xChildContainer = xTreeRoot->getFrames();
		xChildContainer->append(Reference<XFrame>(xFrame, UNO_QUERY));
		xFrame->setName("newly created 1");

		OUString sInputUrl, sAbsoluteInputUrl, sOutputUrl, sAbsoluteOutputUrl, sWorkingDir;
		osl_getProcessWorkingDir(&sWorkingDir.pData);

		osl::FileBase::getFileURLFromSystemPath(IN, sInputUrl);
		osl::FileBase::getAbsoluteFileURL(sWorkingDir, sInputUrl, sAbsoluteInputUrl);

		osl::FileBase::getFileURLFromSystemPath(OUT, sOutputUrl);
		osl::FileBase::getAbsoluteFileURL(sWorkingDir, sOutputUrl, sAbsoluteOutputUrl);

		Reference<XComponentLoader> xComponentLoader(desktop, UNO_QUERY);
		Reference<XComponent> xTemplateComponent = xComponentLoader->loadComponentFromURL(sAbsoluteInputUrl, "newly created 1", FrameSearchFlag::CHILDREN, Sequence<PropertyValue>());
		xWindow->setVisible(false);

		Reference<XBookmarksSupplier> xBookmarksSupplier(xTemplateComponent, UNO_QUERY);
		Reference<XNameAccess> xNamedBookmarks = xBookmarksSupplier->getBookmarks();
		Any bookmark = xNamedBookmarks->getByName("Keywords");

		Reference<XTextContent> xBookmarkContent(bookmark, UNO_QUERY_THROW);
		Reference<XTextRange> xBookmarkRange = xBookmarkContent->getAnchor();
		xBookmarkRange->setString(keywords);

		Sequence<PropertyValue> propertyValue(2);
		propertyValue[0].Name = "FilterName";
		propertyValue[0].Value <<= OUString("writer_pdf_Export");
		propertyValue[1].Name = "URL";
		propertyValue[1].Value <<= sAbsoluteOutputUrl;

		Reference<XStorable> xStorable(xTemplateComponent, UNO_QUERY);
		xStorable->storeToURL(sAbsoluteOutputUrl, propertyValue);

		xTemplateComponent->dispose();
		Reference<XComponent>::query(xLocalServiceManager)->dispose();

		return true;
	} catch (Exception& e) {
		std::cerr << e.Message << std::endl;
	}

	return false;
}

SAL_IMPLEMENT_MAIN() {
	std::vector<std::string> keywords;

	read(keywords);
	std::string bookmark(getBookmark(keywords));

	std::future<bool> good(std::async(run, OUString(bookmark.data(), bookmark.size(), RTL_TEXTENCODING_UTF8)));
	// TODO optional: timeout

	if (good.get()) {
		/* TODO optional post-processing:
		 *
		 * start(...);
		 * start(...);
		 * start(...);
		 * ...
		 *
		 */

		write();
		exit(EXIT_SUCCESS);
	} else {
		exit(EXIT_FAILURE);
	}
}
