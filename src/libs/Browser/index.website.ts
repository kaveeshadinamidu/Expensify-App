import CONFIG from '@src/CONFIG';
import CONST from '@src/CONST';
import ROUTES from '@src/ROUTES';
import type {GetBrowser, IsChromeIOS, IsMobile, IsMobileChrome, IsMobileIOS, IsMobileSafari, IsMobileWebKit, IsModernSafari, IsSafari, OpenRouteInDesktopApp} from './types';

let isOpenRouteInDesktop = false;
/**
 * Fetch browser name from UA string
 *
 */
const getBrowser: GetBrowser = () => {
    const {userAgent} = window.navigator;
    const match = userAgent.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))/i) ?? [];
    let temp: RegExpMatchArray | null;
    let browserName = '';

    if (/trident/i.test(match[1])) {
        return 'IE';
    }

    if (match[1] && match[1].toLowerCase() === 'chrome') {
        temp = userAgent.match(/\b(OPR)/);
        if (temp !== null) {
            return 'Opera';
        }

        temp = userAgent.match(/\b(Edg)/);
        if (temp !== null) {
            return 'Edge';
        }
    }

    browserName = match[1];
    return browserName ? browserName.toLowerCase() : CONST.BROWSER.OTHER;
};

/**
 * Whether the platform is a mobile browser.
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Browser_detection_using_the_user_agent
 *
 */
const isMobile: IsMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Silk|Opera Mini/i.test(navigator.userAgent);

const isMobileIOS: IsMobileIOS = () => {
    const userAgent = navigator.userAgent;
    return /iP(ad|od|hone)/i.test(userAgent);
};

/**
 * Checks if requesting user agent is Safari browser on a mobile device
 *
 */
const isMobileSafari: IsMobileSafari = () => {
    const userAgent = navigator.userAgent;
    return /iP(ad|od|hone)/i.test(userAgent) && /WebKit/i.test(userAgent) && !/(CriOS|FxiOS|OPiOS|mercury)/i.test(userAgent);
};

/**
 * Checks if requesting user agent is Chrome browser on a mobile device
 *
 */
const isMobileChrome: IsMobileChrome = () => {
    const userAgent = navigator.userAgent;
    return /Android/i.test(userAgent) && /chrome|chromium|crios/i.test(userAgent);
};

/**
 * Checks if the requesting user agent is a WebKit-based browser on an iOS mobile device.
 */
const isMobileWebKit: IsMobileWebKit = () => {
    const userAgent = navigator.userAgent;
    return /iP(ad|od|hone)/i.test(userAgent) && /WebKit/i.test(userAgent);
};

/**
 * Checks if the requesting user agent is a Chrome browser on an iOS mobile device.
 */
const isChromeIOS: IsChromeIOS = () => {
    const userAgent = navigator.userAgent;
    return /iP(ad|od|hone)/i.test(userAgent) && /CriOS/i.test(userAgent);
};

const isSafari: IsSafari = () => getBrowser() === 'safari' || isMobileSafari();

/**
 * Checks if the requesting user agent is a modern version of Safari on iOS (version 18 or higher).
 */
const isModernSafari: IsModernSafari = (): boolean => {
    const version = navigator.userAgent.match(/OS (\d+_\d+)/);
    const iosVersion = version ? version[1].replace('_', '.') : '';

    return parseFloat(iosVersion) >= 18;
};

/**
 * The session information needs to be passed to the Desktop app, and the only way to do that is by using query params. There is no other way to transfer the data.
 */
const openRouteInDesktopApp: OpenRouteInDesktopApp = (shortLivedAuthToken = '', email = '', initialRoute = '') => {
    const params = new URLSearchParams();
    // If the user is opening the desktop app through a third party signin flow, we need to manually add the exitTo param
    // so that the desktop app redirects to the correct home route after signin is complete.
    const openingFromDesktopRedirect = window.location.pathname === `/${ROUTES.DESKTOP_SIGN_IN_REDIRECT}`;
    params.set('exitTo', `${openingFromDesktopRedirect ? '/r' : initialRoute || window.location.pathname}${window.location.search}${window.location.hash}`);
    if (email && shortLivedAuthToken) {
        params.set('email', email);
        params.set('shortLivedAuthToken', shortLivedAuthToken);
    }
    const expensifyUrl = new URL(CONFIG.EXPENSIFY.NEW_EXPENSIFY_URL);
    const expensifyDeeplinkUrl = `${CONST.DEEPLINK_BASE_URL}${expensifyUrl.host}/transition?${params.toString()}`;

    const browser = getBrowser();

    // This check is necessary for Safari, otherwise, if the user
    // does NOT have the Expensify desktop app installed, it's gonna
    // show an error in the page saying that the address is invalid.
    // It is also necessary for Firefox, otherwise the window.location.href redirect
    // will abort the fetch request from NetInfo, which will cause the app to go offline temporarily.
    if (browser === CONST.BROWSER.SAFARI || browser === CONST.BROWSER.FIREFOX) {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        if (iframe.contentWindow) {
            iframe.contentWindow.location.href = expensifyDeeplinkUrl;
        }
        // Since we're creating an iframe for Safari to handle deeplink,
        // we need to give Safari some time to open the pop-up window.
        // After that we can just remove the iframe.
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 0);
    } else {
        isOpenRouteInDesktop = true;
        window.location.href = expensifyDeeplinkUrl;
    }
};

const isOpeningRouteInDesktop = () => {
    return isOpenRouteInDesktop;
};

const resetIsOpeningRouteInDesktop = () => {
    isOpenRouteInDesktop = false;
};

export {
    getBrowser,
    isMobile,
    isMobileIOS,
    isMobileSafari,
    isMobileWebKit,
    isSafari,
    isModernSafari,
    isMobileChrome,
    isChromeIOS,
    openRouteInDesktopApp,
    isOpeningRouteInDesktop,
    resetIsOpeningRouteInDesktop,
};
