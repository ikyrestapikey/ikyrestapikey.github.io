import axios from 'axios';
import { logApiRequest } from '../../utils/logger';

async function aio(url) {
    if (!url || !url.includes('https://')) throw new Error('Url is required');
    const { data } = await axios.post('https://auto-download-all-in-one.p.rapidapi.com/v1/social/autolink', 
        { url: url }, 
        {
            headers: {
                'x-rapidapi-host': 'auto-download-all-in-one.p.rapidapi.com',
                'x-rapidapi-key': '1dda0d29d3mshc5f2aacec619c44p16f219jsn99a62a516f98',
                'content-type': 'application/json',
            }
        }
    );
    return data;
}

export default async function handler(req, res) {
    const endpoint = '/api/aio';
    const { url } = req.query;

    if (!url) {
        await logApiRequest(endpoint, 400);
        return res.status(400).json({ success: false, error: 'Query parameter "url" is required.' });
    }

    try {
        const result = await aio(url);
        await logApiRequest(endpoint, 200);
        res.status(200).json({ success: true, result });
    } catch (error) {
        await logApiRequest(endpoint, 500);
        res.status(500).json({ success: false, error: 'Failed to download media.', details: error.message });
    }
}
