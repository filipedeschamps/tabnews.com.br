import { v4 as uuid } from 'uuid';

export default function UuidMaker() {
  function makeUuid() {
    return uuid();
  }

  return {
    makeUuid
  }
}
