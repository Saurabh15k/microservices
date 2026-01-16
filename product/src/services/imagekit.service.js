const ImageKit = require('@imagekit/nodejs');
const { v4: uuidv4 } = require('uuid');
const { toFile } = require('@imagekit/nodejs');

const client = new ImageKit({
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

async function uploadImage({ buffer, folder = '/products' }) {
    if(!buffer){
        throw new Error('Image buffer is required');
    }
    const file = await toFile(buffer, `${uuidv4()}.jpg`);
    const res = await client.files.upload({
        file,
        fileName: file.name,
        folder
    })
    return {
        url: res.url,
        id: res.fileId,
        thumbnail: res.thumbnail || res.url
    }
}


module.exports = { uploadImage, client };