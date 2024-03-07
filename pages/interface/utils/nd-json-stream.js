import { isValidJsonString } from 'pages/interface';

export default function processNdJsonStream(stream, cb) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let partialData = '';

  const readChunk = () => {
    reader.read().then(({ done, value }) => {
      if (done) return;
      partialData += decoder.decode(value, { stream: true });

      partialData = processChunk(partialData, cb);

      readChunk();
    });
  };

  readChunk();
}

function processChunk(chunk, cb) {
  let partialData = chunk;
  let delimiterIndex = -1;

  if (isValidJsonString(partialData)) {
    cb(JSON.parse(partialData));
    return '';
  }

  while ((delimiterIndex = partialData.lastIndexOf('\n')) !== -1) {
    partialData = partialData.slice(0, delimiterIndex);

    if (isValidJsonString(partialData)) {
      cb(JSON.parse(partialData));

      return processChunk(chunk.slice(delimiterIndex + 1), cb);
    }
  }

  return chunk;
}
