module.exports = function evalPlugin() {
    return {
        name: 'eval',
        async transform(data, id) {
            if (id.slice(-8) !== '.eval.js') return null;
            try {
                return {
                    code: await eval(data)(),
                    map: { mappings: '' },
                };
            } catch (err) {
                this.error({ message: 'Failed to eval JS: ' + err, id, position: 0 });
                return null;
            }
        },
    };
};

