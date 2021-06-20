
const withImages = require('next-images');
const myconfig = withImages({})

myconfig.pageExtensions = ["public.js"];
myconfig.images = { disableStaticImages: true }
module.exports = myconfig