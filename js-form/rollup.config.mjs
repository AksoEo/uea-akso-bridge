import path from 'path';
import url from 'url';
import fs from 'fs';
import alias from '@rollup/plugin-alias';
import { babel } from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';
import ini from 'ini';
import { dataToEsm } from '@rollup/pluginutils';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';

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
        amdDefine(),
        babel({
            presets: ['@babel/preset-env'],
            babelHelpers: 'bundled',
            exclude: ['node_modules/**'],
        }),
        resolve(),
        commonjs(),
        isProd && terser(),
    ].filter(x => x),
    preserveEntrySignatures: false,
    output: {
        dir: path.join(__dirname, '../js/form/'),
        chunkFileNames: '[name].js',
        format: 'amd',
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

function amdDefine() {
    const define = fs.readFileSync(__dirname + '/define.js');

    return {
        id: 'amd-define',
        renderChunk (code, chunk, opts) {
            return define + code;
        },
    };
}
