import score from 'string-score';

function espNormalize(s) {
    return s.toLowerCase()
        .replace(/ch|cx|ĉ|ĉ/g, 'c')
        .replace(/gh|gx|ĝ|ĝ/g, 'g')
        .replace(/hh|hx|ĥ|ĥ/g, 'h')
        .replace(/jh|jx|ĵ|ĵ/g, 'j')
        .replace(/sh|sx|ŝ|ŝ/g, 's')
        .replace(/uh|ux|ŭ|ŭ/g, 'u');
}

export function fuzzyScore(a, b) {
    return score(espNormalize(a), espNormalize(b), 0.5);
}
