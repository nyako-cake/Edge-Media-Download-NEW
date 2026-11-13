/** X Chat 的 Thrift 二进制结构解析：只读，够用即可 */
class Reader {
  constructor(data) {
    this.data = data;
    this.offset = 0;
  }
  take(count) {
    if (this.offset + count > this.data.length) throw new Error("thrift truncated");
    const chunk = this.data.slice(this.offset, this.offset + count);
    this.offset += count;
    return chunk;
  }
  int(size) {
    const raw = this.take(size);
    let value = 0;
    for (let index = 0; index < raw.length; index++) value = value * 256 + raw[index];
    if (raw[0] & 0x80) value -= Math.pow(256, size);
    return value;
  }
  value(kind) {
    if (kind === 2) return this.take(1)[0] !== 0;
    if (kind === 3) return this.int(1);
    if (kind === 4) return this.take(8);
    if (kind === 6) return this.int(2);
    if (kind === 8) return this.int(4);
    if (kind === 10) return this.int(8);
    if (kind === 11) return this.take(this.int(4));
    if (kind === 12) return this.struct();
    if (kind === 13) {
      const keyKind = this.int(1);
      const valueKind = this.int(1);
      const size = this.int(4);
      const map = [];
      for (let index = 0; index < size; index++) map.push([this.value(keyKind), this.value(valueKind)]);
      return map;
    }
    if (kind === 14 || kind === 15) {
      const elementKind = this.int(1);
      const size = this.int(4);
      const list = [];
      for (let index = 0; index < size; index++) list.push(this.value(elementKind));
      return list;
    }
    throw new Error("thrift unknown type " + kind);
  }
  struct() {
    const fields = {};
    while (true) {
      const kind = this.int(1);
      if (kind === 0) return fields;
      const fieldId = this.int(2);
      fields[fieldId] = this.value(kind);
    }
  }
}

function decode(base64) {
  return new Reader(Buffer.from(base64, "base64")).struct();
}

function text(value) {
  return Buffer.isBuffer(value) ? value.toString("utf8") : null;
}

module.exports = { Reader, decode, text };
