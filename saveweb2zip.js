import axios from 'axios';
import { logApiRequest } from '../../utils/logger';

async function saveweb2zip(url, options = {}) {
    try {
        if (!url) throw new Error('Url is required');
        url = url.startsWith('https://') ? url : `https://${url}`;
        const { renameAssets = false, saveStructure = false, alternativeAlgorithm = false, mobileVersion = false } = options;
        const { data } = await axios.post('https://copier.saveweb2zip.com/api/copySite', { url, renameAssets, saveStructure, alternativeAlgorithm, mobileVersion }, { headers: { accept: '*/*', 'content-type': 'application/json', origin: 'https://saveweb2zip.com', referer: 'https://saveweb2zip.com/', 'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36' } });
        while (true) {
            const { data: process } = await axios.get(`https://copier.saveweb2zip.com/api/getStatus/${data.md5}`, { headers: { accept: '*/*', 'content-type': 'application/json', origin: 'https://saveweb2zip.com', referer: 'https://saveweb2zip.com/', 'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36' } });
            if (!process.isFinished) { continue; } else { return { url, error: { text: process.errorText, code: process.errorCode, }, copiedFilesAmount: process.copiedFilesAmount, downloadUrl: `https://copier.saveweb2zip.com/api/downloadArchive/${process.md5}` } }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    } catch (error) { throw new Error(error.message); }
}

export default async function handler(req, res) {
    const endpoint = '/api/saveweb2zip';
    const { url, renameAssets, saveStructure, alternativeAlgorithm, mobileVersion } = req.query;
    if (!url) {
        await logApiRequest(endpoint, 400);
        return res.status(400).json({ error: 'Query `url` is required.' });
    }
    try {
        const options = { renameAssets: renameAssets === 'true', saveStructure: saveStructure === 'true', alternativeAlgorithm: alternativeAlgorithm === 'true', mobileVersion: mobileVersion === 'true' };
        const result = await saveweb2zip(url, options);
        await logApiRequest(endpoint, 200);
        res.status(200).json({ success: true, result });
    } catch (error) {
        await logApiRequest(endpoint, 500);
        res.status(500).json({ success: false, error: 'Failed to process request.', details: String(error) });
    }
}
