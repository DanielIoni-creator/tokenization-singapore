// middleware/i18n.js
const fs = require('fs');
const path = require('path');

class I18nService {
  constructor() {
    this.locales = {};
    this.defaultLocale = 'en';
    this.supportedLocales = ['en', 'zh', 'ms', 'ta'];
    this.loadLocales();
  }

  loadLocales() {
    const localesDir = path.join(__dirname, '../locales');
    
    for (const locale of this.supportedLocales) {
      try {
        const filePath = path.join(localesDir, `${locale}.json`);
        const content = fs.readFileSync(filePath, 'utf8');
        this.locales[locale] = JSON.parse(content);
        console.log(`✅ Loaded locale: ${locale}`);
      } catch (error) {
        console.warn(`⚠️ Failed to load locale: ${locale}`, error.message);
        this.locales[locale] = {};
      }
    }
  }

  getTranslation(locale, key) {
    const lang = this.supportedLocales.includes(locale) ? locale : this.defaultLocale;
    const keys = key.split('.');
    let value = this.locales[lang];
    
    for (const k of keys) {
      if (value && value[k] !== undefined) {
        value = value[k];
      } else {
        return this.getTranslation(this.defaultLocale, key);
      }
    }
    
    return value || key;
  }

  translate(locale, key, params = {}) {
    let text = this.getTranslation(locale, key);
    for (const [param, value] of Object.entries(params)) {
      text = text.replace(`{{${param}}}`, value);
    }
    return text;
  }

  middleware() {
    return (req, res, next) => {
      let locale = this.defaultLocale;
      
      // 1. Check user language
      if (req.user && req.user.language) {
        locale = req.user.language;
      }
      
      // 2. Check Accept-Language header
      if (locale === this.defaultLocale) {
        const acceptLanguage = req.headers['accept-language'];
        if (acceptLanguage) {
          const langs = acceptLanguage.split(',').map(l => l.trim().split('-')[0]);
          for (const lang of langs) {
            if (this.supportedLocales.includes(lang)) {
              locale = lang;
              break;
            }
          }
        }
      }
      
      // 3. Check query parameter
      if (req.query.lang && this.supportedLocales.includes(req.query.lang)) {
        locale = req.query.lang;
      }
      
      req.locale = locale;
      req.t = (key, params = {}) => this.translate(locale, key, params);
      
      next();
    };
  }
}

module.exports = new I18nService();
