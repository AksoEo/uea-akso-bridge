import path from 'path';
import url from 'url';
import alias from '@rollup/plugin-alias';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import ini from 'ini';
import { dataToEsm } from '@rollup/pluginutils';

// TODO: babel

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

export default {
    input: 'src/index.js',
    plugins: [
        iniPlugin(),
        alias({
            entries: [
                { find: 'punycode', replacement: path.join(__dirname, 'node_modules/punycode2/index.js') },
            ],
        }),
        json(),
        resolve(),
        commonjs(),
    ],
    output: {
        file: path.join(__dirname, '../js/registration-form.js'),
        format: 'iife',
    },
};

function iniPlugin() {
    return {
        name: 'ini',
        transform(data, id) {
            if (id.slice(-4) !== '.ini') return null;
            try {
                const parsed = ini.parse(data);
                return {
                    code: dataToEsm(parsed, {
                        indent: '\t',
                    }),
                    map: { mappings: '' },
                };
            } catch (err) {
                this.warn({
                    message: 'Failed to parse INI',
                    id,
                    position: 0,
                });
                return null;
            }
        },
    };
}
