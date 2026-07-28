const fs = require('fs');
const path = require('path');

const locales = {};
const supportedLanguages = ['en', 'zh', 'ms', 'ta', 'it'];

supportedLanguages.forEach((lang) => {
  try {
    const filePath = path.join(__dirname, '..', 'locales', `${lang}.json`);
    if (fs.existsSync(filePath)) {
      locales[lang] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (err) {
    console.error(`Error loading locale ${lang}:`, err.message);
  }
});

function i18nMiddleware(req, res, next) {
  const acceptLang = req.headers['accept-language'] || 'en';
  let primaryLang = acceptLang.split(',')[0].trim().toLowerCase();
  
  if (primaryLang.includes('-')) {
    primaryLang = primaryLang.split('-')[0];
  }

  const selectedLang = supportedLanguages.includes(primaryLang) ? primaryLang : 'en';

  req.lang = selectedLang;
  req.__ = function (key) {
    const translation = locales[selectedLang] && locales[selectedLang][key];
    return translation || (locales['en'] && locales['en'][key]) || key;
  };

  next();
}

module.exports = i18nMiddleware;
