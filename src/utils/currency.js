export const currencyNames = new Intl.DisplayNames(['en'], { type: 'currency' });

export const getCurrencySymbol = (code) => {
    try {
        return (0).toLocaleString('en-US', { style: 'currency', currency: code }).replace(/[\d.,\s]+/g, '');
    } catch (e) {
        return '';
    }
};
