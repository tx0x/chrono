export default function i18n(name) {
    try {
        return chrome.i18n.getMessage(name) || name
    } catch(e) {
        return name
    }
}