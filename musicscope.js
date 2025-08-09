import axios from 'axios';
import FormData from 'form-data';
import { logApiRequest } from '../../utils/logger';

class MusicScope {
    constructor() { this.api_url = 'https://ziqiangao-musicscopegen.hf.space/gradio_api'; this.file_url = 'https://ziqiangao-musicscopegen.hf.space/gradio_api/file='; }
    generateSession = function () { return Math.random().toString(36).substring(2); }
    upload = async function (buffer, filename) { try { const upload_id = this.generateSession(); const form = new FormData(); form.append('files', buffer, filename); const { data } = await axios.post(`${this.api_url}/upload?upload_id=${upload_id}`, form, { headers: { ...form.getHeaders() }, timeout: 180000 }); return { orig_name: filename, path: data[0], url: `${this.file_url}${data[0]}` }; } catch (error) { throw new Error(error.message); } }
    process = async function ({ title = 'MusicScope', artist = 'Scrape by Rynn', audio, image } = {}) {
        try {
            if (!audio || !Buffer.isBuffer(audio)) throw new Error('Audio buffer is required');
            if (!image || !Buffer.isBuffer(image)) throw new Error('Image buffer is required');
            const audio_url = await this.upload(audio, `${Date.now()}_rynn.mp3`);
            const image_url = await this.upload(image, `${Date.now()}_rynn.jpg`);
            const session_hash = this.generateSession();
            await axios.post(`${this.api_url}/queue/join?`, { data: [ { path: audio_url.path, url: audio_url.url, orig_name: audio_url.orig_name, size: audio.length, mime_type: 'audio/mpeg', meta: { _type: 'gradio.FileData' } }, null, 'Output', 30, 1280, 720, 1024, { path: image_url.path, url: image_url.url, orig_name: image_url.orig_name, size: image.length, mime_type: 'image/jpeg', meta: { _type: 'gradio.FileData' } }, title, artist ], event_data: null, fn_index: 0, trigger_id: 26, session_hash: session_hash }, { timeout: 180000 });
            const { data } = await axios.get(`${this.api_url}/queue/data?session_hash=${session_hash}`, { timeout: 180000 });
            let result; const lines = data.split('\n\n');
            for (const line of lines) { if (line.startsWith('data:')) { const d = JSON.parse(line.substring(6)); if (d.msg === 'process_completed') result = d.output.data[0].video.url; } }
            return result;
        } catch (error) { throw new Error(error.message); }
    }
}

export default async function handler(req, res) {
    const endpoint = '/api/musicscope';
    const { audio_url, image_url, title, artist } = req.query;
    if (!audio_url || !image_url) {
        await logApiRequest(endpoint, 400);
        return res.status(400).json({ error: 'Query `audio_url` and `image_url` are required.' });
    }
    try {
        const audioBuffer = await axios.get(audio_url, { responseType: 'arraybuffer' }).then(res => Buffer.from(res.data));
        const imageBuffer = await axios.get(image_url, { responseType: 'arraybuffer' }).then(res => Buffer.from(res.data));
        const m = new MusicScope();
        const result = await m.process({ audio: audioBuffer, image: imageBuffer, title, artist });
        await logApiRequest(endpoint, 200);
        res.status(200).json({ success: true, result_url: result });
    } catch (error) {
        await logApiRequest(endpoint, 500);
        res.status(500).json({ success: false, error: 'Failed to process request.', details: String(error) });
    }
}
