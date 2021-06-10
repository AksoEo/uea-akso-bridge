// evaluated at compile-time!
(async function() {
    const path = require('path');
    const fs = require('fs');
    const { getValidationRules } = require('@cpsdqs/google-i18n-address');
    const countryCodes = [];
    const dataPath = path.join(require.resolve('@cpsdqs/google-i18n-address'), '../../data');
    for (const f of fs.readdirSync(dataPath)) {
        const m = f.match(/^(\w+)\.json$/);
        if (m) countryCodes.push(m[1]);
    }

    const data = {};
    for (const code of countryCodes) {
        if (code === 'zz') continue;
        data[code] = (await getValidationRules({ countryCode: code })).requiredFields;
    }

    return 'export default ' + JSON.stringify(data);
})
