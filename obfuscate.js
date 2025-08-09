import JavaScriptObfuscator from 'javascript-obfuscator';
import { logApiRequest } from '../../utils/logger';

export default async function handler(req, res) {
    const endpoint = '/api/obfuscate';
    let code;

    if (req.method === 'POST') {
        code = req.body.code;
    } else if (req.method === 'GET') {
        code = req.query.code;
    } else {
        await logApiRequest(endpoint, 405);
        return res.status(405).json({ success: false, error: 'Method Not Allowed. Use GET or POST.' });
    }

    if (!code || typeof code !== 'string' || code.trim() === '') {
        await logApiRequest(endpoint, 400);
        return res.status(400).json({ success: false, error: 'Parameter "code" is required and must not be empty.' });
    }

    try {
        const obfuscationResult = JavaScriptObfuscator.obfuscate(code, {
            compact: true,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 0.75,
            deadCodeInjection: true,
            deadCodeInjectionThreshold: 0.4,
            debugProtection: false,
            disableConsoleOutput: true,
            identifierNamesGenerator: 'hexadecimal',
            log: false,
            renameGlobals: false,
            rotateStringArray: true,
            selfDefending: true,
            shuffleStringArray: true,
            splitStrings: true,
            splitStringsChunkLength: 10,
            stringArray: true,
            stringArrayEncoding: ['base64'],
            stringArrayThreshold: 0.75,
            transformObjectKeys: true,
            unicodeEscapeSequence: false
        });

        const obfuscatedCode = obfuscationResult.getObfuscatedCode();

        await logApiRequest(endpoint, 200);
        res.status(200).json({
            success: true,
            result: {
                obfuscated_code: obfuscatedCode
            }
        });

    } catch (error) {
        await logApiRequest(endpoint, 500);
        res.status(500).json({
            success: false,
            error: 'Failed to obfuscate code. It might contain invalid JavaScript syntax.',
            details: error.message
        });
    }
}
