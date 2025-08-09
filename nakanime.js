import axios from 'axios';
import { logApiRequest } from '../../utils/logger';

class Nakanime {
    constructor() { this.client = axios.create({ baseURL: 'https://anime.nakanime.my.id/api/anime', headers: { accept: 'application/json, text/plain, */*', 'accept-encoding': 'gzip', 'user-agent': 'okhttp/4.9.2' } }); }
    search = async function (query) { try { if (!query) throw new Error('Query is required'); const { data } = await this.client('/search/', { params: { keyword: query } }); return data; } catch (error) { throw new Error(error.message); } }
    getDetail = async function (url) { try { const match = url.match(/^https:\/\/api\.nakanime\.my\.id\/anime\/([^\/]+)\/?$/); if (!match) throw new Error('Invalid url'); const { data } = await this.client({ params: { name: match[1] } }); return data; } catch (error) { throw new Error(error.message); } }
    getData = async function (url) { try { const match = url.match(/^https:\/\/api\.nakanime\.my\.id\/([^\/]+episode-[^\/]+)\/?$/); if (!match) throw new Error('Invalid url'); const { data } = await this.client('/data/', { params: { slug: match[1] } }); return data; } catch (error) { throw new Error(error.message); } }
}

export default async function handler(req, res) {
    const endpoint = '/api/nakanime';
    const { action, query, url } = req.query;
    const n = new Nakanime();
    try {
        let result;
        switch (action) {
            case 'search': result = await n.search(query); break;
            case 'detail': result = await n.getDetail(url); break;
            case 'episode': result = await n.getData(url); break;
            default:
                await logApiRequest(endpoint, 400);
                return res.status(400).json({ error: 'Invalid action. Available: search, detail, episode' });
        }
        await logApiRequest(endpoint, 200);
        res.status(200).json({ success: true, result });
    } catch (error) {
        await logApiRequest(endpoint, 500);
        res.status(500).json({ success: false, error: 'Failed to process request.', details: String(error) });
    }
}
