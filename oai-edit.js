import axios from 'axios';
import FormData from 'form-data';
import { logApiRequest } from '../../utils/logger';

export async function editImage(imageUrl, prompt) {
  try {
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(imageResponse.data);
    const form = new FormData();
    form.append('image', imageBuffer, { filename: 'image.png', contentType: 'image/png' });
    form.append('prompt', prompt); form.append('model', 'gpt-image-1'); form.append('n', '1'); form.append('size', '1024x1024'); form.append('quality', 'medium');
    const response = await axios.post('https://api.openai.com/v1/images/edits', form, { headers: { ...form.getHeaders(), Authorization: `Bearer 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` } });
    const base64 = response.data?.data?.[0]?.b64_json;
    if (!base64) throw new Error('ga ada respon nih');
    return base64;
  } catch (err) { throw new Error(err.message); }
}

export default async function handler(req, res) {
    const endpoint = '/api/oai-edit';
    const { url, prompt } = req.query;
    if (!url || !prompt) {
        await logApiRequest(endpoint, 400);
        return res.status(400).json({ error: 'Query `url` and `prompt` are required.' });
    }
    try {
        const result = await editImage(url, prompt);
        res.setHeader('Content-Type', 'image/png');
        await logApiRequest(endpoint, 200);
        res.send(Buffer.from(result, 'base64'));
    } catch (error) {
        await logApiRequest(endpoint, 500);
        res.status(500).json({ success: false, error: 'Failed to process request.', details: String(error) });
    }
}
