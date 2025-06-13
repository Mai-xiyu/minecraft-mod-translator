/**
 * Java字节码解析器 - 正确解析常量池
 * 作者：饩雨
 * 
 * 实现Java Class文件格式的解析，正确处理常量池中的字符串常量
 */

class JavaBytecodeParser {
    constructor() {
        // 常量池类型常量
        this.CONSTANT_TYPE = {
            UTF8: 1,
            INTEGER: 3,
            FLOAT: 4,
            LONG: 5,
            DOUBLE: 6,
            CLASS: 7,
            STRING: 8,
            FIELDREF: 9,
            METHODREF: 10,
            INTERFACE_METHODREF: 11,
            NAME_AND_TYPE: 12,
            METHOD_HANDLE: 15,
            METHOD_TYPE: 16,
            INVOKE_DYNAMIC: 18
        };
    }

    /**
     * 解析Java class文件
     * @param {Uint8Array} bytecode - class文件的字节码
     * @returns {Object} 解析结果
     */
    parseClassFile(bytecode) {
        const reader = new BytecodeReader(bytecode);
        
        try {
            // 验证magic number
            const magic = reader.readU4();
            if (magic !== 0xCAFEBABE) {
                throw new Error('无效的Java class文件：magic number不匹配');
            }

            // 读取版本信息
            const minorVersion = reader.readU2();
            const majorVersion = reader.readU2();

            // 解析常量池
            const constantPoolCount = reader.readU2();
            const constantPool = this.parseConstantPool(reader, constantPoolCount);

            // 读取类的基本信息
            const accessFlags = reader.readU2();
            const thisClass = reader.readU2();
            const superClass = reader.readU2();

            // 读取接口信息
            const interfacesCount = reader.readU2();
            const interfaces = [];
            for (let i = 0; i < interfacesCount; i++) {
                interfaces.push(reader.readU2());
            }

            // 读取字段信息
            const fieldsCount = reader.readU2();
            const fields = this.parseFields(reader, fieldsCount, constantPool);

            // 读取方法信息
            const methodsCount = reader.readU2();
            const methods = this.parseMethods(reader, methodsCount, constantPool);

            // 读取属性信息
            const attributesCount = reader.readU2();
            const attributes = this.parseAttributes(reader, attributesCount, constantPool);

            return {
                magic,
                minorVersion,
                majorVersion,
                constantPool,
                accessFlags,
                thisClass,
                superClass,
                interfaces,
                fields,
                methods,
                attributes,
                reader: reader // 保留reader用于重建
            };

        } catch (error) {
            throw new Error(`解析class文件失败: ${error.message}`);
        }
    }

    /**
     * 解析常量池
     */
    parseConstantPool(reader, count) {
        const pool = new Array(count);
        pool[0] = null; // 常量池索引从1开始

        for (let i = 1; i < count; i++) {
            const tag = reader.readU1();
            
            switch (tag) {
                case this.CONSTANT_TYPE.UTF8:
                    const length = reader.readU2();
                    const bytes = reader.readBytes(length);
                    const text = this.decodeModifiedUTF8(bytes);
                    pool[i] = {
                        tag: tag,
                        length: length,
                        bytes: bytes,
                        text: text
                    };
                    break;

                case this.CONSTANT_TYPE.STRING:
                    pool[i] = {
                        tag: tag,
                        stringIndex: reader.readU2()
                    };
                    break;

                case this.CONSTANT_TYPE.CLASS:
                    pool[i] = {
                        tag: tag,
                        nameIndex: reader.readU2()
                    };
                    break;

                case this.CONSTANT_TYPE.INTEGER:
                    pool[i] = {
                        tag: tag,
                        value: reader.readU4()
                    };
                    break;

                case this.CONSTANT_TYPE.FLOAT:
                    pool[i] = {
                        tag: tag,
                        value: reader.readFloat()
                    };
                    break;

                case this.CONSTANT_TYPE.LONG:
                    pool[i] = {
                        tag: tag,
                        highBytes: reader.readU4(),
                        lowBytes: reader.readU4()
                    };
                    // Long和Double占用两个常量池位置
                    i++;
                    pool[i] = null;
                    break;

                case this.CONSTANT_TYPE.DOUBLE:
                    pool[i] = {
                        tag: tag,
                        highBytes: reader.readU4(),
                        lowBytes: reader.readU4()
                    };
                    // Long和Double占用两个常量池位置
                    i++;
                    pool[i] = null;
                    break;

                case this.CONSTANT_TYPE.FIELDREF:
                case this.CONSTANT_TYPE.METHODREF:
                case this.CONSTANT_TYPE.INTERFACE_METHODREF:
                    pool[i] = {
                        tag: tag,
                        classIndex: reader.readU2(),
                        nameAndTypeIndex: reader.readU2()
                    };
                    break;

                case this.CONSTANT_TYPE.NAME_AND_TYPE:
                    pool[i] = {
                        tag: tag,
                        nameIndex: reader.readU2(),
                        descriptorIndex: reader.readU2()
                    };
                    break;

                case this.CONSTANT_TYPE.METHOD_HANDLE:
                    pool[i] = {
                        tag: tag,
                        referenceKind: reader.readU1(),
                        referenceIndex: reader.readU2()
                    };
                    break;

                case this.CONSTANT_TYPE.METHOD_TYPE:
                    pool[i] = {
                        tag: tag,
                        descriptorIndex: reader.readU2()
                    };
                    break;

                case this.CONSTANT_TYPE.INVOKE_DYNAMIC:
                    pool[i] = {
                        tag: tag,
                        bootstrapMethodAttrIndex: reader.readU2(),
                        nameAndTypeIndex: reader.readU2()
                    };
                    break;

                default:
                    throw new Error(`未知的常量池标签类型: ${tag}`);
            }
        }

        return pool;
    }

    /**
     * 解码Modified UTF-8
     * Java使用Modified UTF-8编码，与标准UTF-8略有不同
     */
    decodeModifiedUTF8(bytes) {
        const result = [];
        let i = 0;

        while (i < bytes.length) {
            const b1 = bytes[i++];

            if ((b1 & 0x80) === 0) {
                // 单字节字符 (0xxxxxxx)
                result.push(String.fromCharCode(b1));
            } else if ((b1 & 0xE0) === 0xC0) {
                // 双字节字符 (110xxxxx 10xxxxxx)
                if (i >= bytes.length) break;
                const b2 = bytes[i++];
                const code = ((b1 & 0x1F) << 6) | (b2 & 0x3F);
                result.push(String.fromCharCode(code));
            } else if ((b1 & 0xF0) === 0xE0) {
                // 三字节字符 (1110xxxx 10xxxxxx 10xxxxxx)
                if (i + 1 >= bytes.length) break;
                const b2 = bytes[i++];
                const b3 = bytes[i++];
                const code = ((b1 & 0x0F) << 12) | ((b2 & 0x3F) << 6) | (b3 & 0x3F);
                result.push(String.fromCharCode(code));
            } else {
                // 跳过无效字节
                result.push('?');
            }
        }

        return result.join('');
    }

    /**
     * 编码为Modified UTF-8
     */
    encodeModifiedUTF8(text) {
        const result = [];

        for (let i = 0; i < text.length; i++) {
            const code = text.charCodeAt(i);

            if (code >= 0x0001 && code <= 0x007F) {
                // 单字节 (0xxxxxxx)
                result.push(code);
            } else if (code === 0x0000 || (code >= 0x0080 && code <= 0x07FF)) {
                // 双字节 (110xxxxx 10xxxxxx)
                result.push(0xC0 | ((code >> 6) & 0x1F));
                result.push(0x80 | (code & 0x3F));
            } else {
                // 三字节 (1110xxxx 10xxxxxx 10xxxxxx)
                result.push(0xE0 | ((code >> 12) & 0x0F));
                result.push(0x80 | ((code >> 6) & 0x3F));
                result.push(0x80 | (code & 0x3F));
            }
        }

        return new Uint8Array(result);
    }

    /**
     * 重建class文件字节码
     */
    rebuildClassFile(classData) {
        const writer = new BytecodeWriter();

        try {
            // Magic number
            writer.writeU4(classData.magic);

            // 版本信息
            writer.writeU2(classData.minorVersion);
            writer.writeU2(classData.majorVersion);

            // 常量池
            writer.writeU2(classData.constantPool.length);
            this.writeConstantPool(writer, classData.constantPool);

            // 类信息
            writer.writeU2(classData.accessFlags);
            writer.writeU2(classData.thisClass);
            writer.writeU2(classData.superClass);

            // 接口
            writer.writeU2(classData.interfaces.length);
            for (const interfaceIndex of classData.interfaces) {
                writer.writeU2(interfaceIndex);
            }

            // 字段
            writer.writeU2(classData.fields.length);
            this.writeFields(writer, classData.fields);

            // 方法
            writer.writeU2(classData.methods.length);
            this.writeMethods(writer, classData.methods);

            // 属性
            writer.writeU2(classData.attributes.length);
            this.writeAttributes(writer, classData.attributes);

            return writer.toUint8Array();

        } catch (error) {
            throw new Error(`重建class文件失败: ${error.message}`);
        }
    }

    /**
     * 写入常量池
     */
    writeConstantPool(writer, constantPool) {
        for (let i = 1; i < constantPool.length; i++) {
            const entry = constantPool[i];
            if (!entry) continue;

            writer.writeU1(entry.tag);

            switch (entry.tag) {
                case this.CONSTANT_TYPE.UTF8:
                    const bytes = this.encodeModifiedUTF8(entry.text);
                    writer.writeU2(bytes.length);
                    writer.writeBytes(bytes);
                    break;

                case this.CONSTANT_TYPE.STRING:
                    writer.writeU2(entry.stringIndex);
                    break;

                case this.CONSTANT_TYPE.CLASS:
                    writer.writeU2(entry.nameIndex);
                    break;

                case this.CONSTANT_TYPE.INTEGER:
                    writer.writeU4(entry.value);
                    break;

                case this.CONSTANT_TYPE.FLOAT:
                    writer.writeFloat(entry.value);
                    break;

                case this.CONSTANT_TYPE.LONG:
                    writer.writeU4(entry.highBytes);
                    writer.writeU4(entry.lowBytes);
                    i++; // 跳过下一个位置
                    break;

                case this.CONSTANT_TYPE.DOUBLE:
                    writer.writeU4(entry.highBytes);
                    writer.writeU4(entry.lowBytes);
                    i++; // 跳过下一个位置
                    break;

                case this.CONSTANT_TYPE.FIELDREF:
                case this.CONSTANT_TYPE.METHODREF:
                case this.CONSTANT_TYPE.INTERFACE_METHODREF:
                    writer.writeU2(entry.classIndex);
                    writer.writeU2(entry.nameAndTypeIndex);
                    break;

                case this.CONSTANT_TYPE.NAME_AND_TYPE:
                    writer.writeU2(entry.nameIndex);
                    writer.writeU2(entry.descriptorIndex);
                    break;

                case this.CONSTANT_TYPE.METHOD_HANDLE:
                    writer.writeU1(entry.referenceKind);
                    writer.writeU2(entry.referenceIndex);
                    break;

                case this.CONSTANT_TYPE.METHOD_TYPE:
                    writer.writeU2(entry.descriptorIndex);
                    break;

                case this.CONSTANT_TYPE.INVOKE_DYNAMIC:
                    writer.writeU2(entry.bootstrapMethodAttrIndex);
                    writer.writeU2(entry.nameAndTypeIndex);
                    break;
            }
        }
    }

    /**
     * 解析方法的Code属性
     */
    parseCodeAttribute(attributeInfo, constantPool) {
        const reader = new BytecodeReader(attributeInfo);
        
        const maxStack = reader.readU2();
        const maxLocals = reader.readU2();
        const codeLength = reader.readU4();
        const code = reader.readBytes(codeLength);
        
        const exceptionTableLength = reader.readU2();
        const exceptionTable = [];
        for (let i = 0; i < exceptionTableLength; i++) {
            exceptionTable.push({
                startPc: reader.readU2(),
                endPc: reader.readU2(),
                handlerPc: reader.readU2(),
                catchType: reader.readU2()
            });
        }
        
        const attributesCount = reader.readU2();
        const attributes = [];
        for (let i = 0; i < attributesCount; i++) {
            const nameIndex = reader.readU2();
            const length = reader.readU4();
            const info = reader.readBytes(length);
            attributes.push({
                attributeNameIndex: nameIndex,
                attributeLength: length,
                info: info
            });
        }
        
        return {
            maxStack,
            maxLocals,
            codeLength,
            code,
            exceptionTable,
            attributes
        };
    }

    /**
     * 在字节码中查找LDC指令并返回常量池索引
     */
    findLdcInstructions(codeBytes) {
        const ldcIndices = [];
        const code = new Uint8Array(codeBytes);
        
        for (let i = 0; i < code.length; i++) {
            const opcode = code[i];
            
            switch (opcode) {
                case 0x12: // ldc
                    if (i + 1 < code.length) {
                        ldcIndices.push({
                            type: 'ldc',
                            index: code[i + 1],
                            pc: i
                        });
                        i += 1; // 跳过操作数
                    }
                    break;
                    
                case 0x13: // ldc_w
                    if (i + 2 < code.length) {
                        const index = (code[i + 1] << 8) | code[i + 2];
                        ldcIndices.push({
                            type: 'ldc_w',
                            index: index,
                            pc: i
                        });
                        i += 2; // 跳过操作数
                    }
                    break;
                    
                case 0x14: // ldc2_w (long/double)
                    if (i + 2 < code.length) {
                        const index = (code[i + 1] << 8) | code[i + 2];
                        ldcIndices.push({
                            type: 'ldc2_w',
                            index: index,
                            pc: i
                        });
                        i += 2; // 跳过操作数
                    }
                    break;
                    
                default:
                    // 跳过其他指令的操作数
                    i += this.getInstructionOperandLength(opcode);
                    break;
            }
        }
        
        return ldcIndices;
    }

    /**
     * 获取指令操作数长度（简化版本）
     */
    getInstructionOperandLength(opcode) {
        // JVM指令操作数长度表（简化版本，只包含常见指令）
        const operandLengths = {
            // 无操作数指令
            0x00: 0, // nop
            0x01: 0, // aconst_null
            0x02: 0, // iconst_m1
            0x03: 0, // iconst_0
            0x04: 0, // iconst_1
            0x05: 0, // iconst_2
            0x06: 0, // iconst_3
            0x07: 0, // iconst_4
            0x08: 0, // iconst_5
            0x09: 0, // lconst_0
            0x0a: 0, // lconst_1
            0x0b: 0, // fconst_0
            0x0c: 0, // fconst_1
            0x0d: 0, // fconst_2
            0x0e: 0, // dconst_0
            0x0f: 0, // dconst_1
            
            // 1字节操作数
            0x10: 1, // bipush
            0x15: 1, // iload
            0x16: 1, // lload
            0x17: 1, // fload
            0x18: 1, // dload
            0x19: 1, // aload
            0x36: 1, // istore
            0x37: 1, // lstore
            0x38: 1, // fstore
            0x39: 1, // dstore
            0x3a: 1, // astore
            0xa9: 1, // ret
            
            // 2字节操作数
            0x11: 2, // sipush
            0x12: 1, // ldc (1字节索引)
            0x13: 2, // ldc_w
            0x14: 2, // ldc2_w
            0x84: 2, // iinc
            0x99: 2, // ifeq
            0x9a: 2, // ifne
            0x9b: 2, // iflt
            0x9c: 2, // ifge
            0x9d: 2, // ifgt
            0x9e: 2, // ifle
            0x9f: 2, // if_icmpeq
            0xa0: 2, // if_icmpne
            0xa1: 2, // if_icmplt
            0xa2: 2, // if_icmpge
            0xa3: 2, // if_icmpgt
            0xa4: 2, // if_icmple
            0xa5: 2, // if_acmpeq
            0xa6: 2, // if_acmpne
            0xa7: 2, // goto
            0xa8: 2, // jsr
            0xb2: 2, // getstatic
            0xb3: 2, // putstatic
            0xb4: 2, // getfield
            0xb5: 2, // putfield
            0xb6: 2, // invokevirtual
            0xb7: 2, // invokespecial
            0xb8: 2, // invokestatic
            0xbb: 2, // new
            0xbc: 1, // newarray
            0xbd: 2, // anewarray
            0xc0: 2, // checkcast
            0xc1: 2, // instanceof
            0xc6: 2, // ifnull
            0xc7: 2, // ifnonnull
            
            // 特殊指令
            0xaa: -1, // tableswitch (变长)
            0xab: -1, // lookupswitch (变长)
            0xb9: 4, // invokeinterface (4字节+1字节count+1字节0)
            0xba: 4, // invokedynamic
            0xc4: -1, // wide (变长)
            0xc5: 3, // multianewarray
            0xc8: 4, // goto_w
            0xc9: 4, // jsr_w
        };
        
        const length = operandLengths[opcode];
        if (length === undefined) {
            // 对于未知指令，返回0（无操作数）
            return 0;
        } else if (length === -1) {
            // 对于变长指令，需要特殊处理，这里简化为0
            return 0;
        } else {
            return length;
        }
    }

    /**
     * 提取字符串常量（增强版本，包含LDC分析）
     */
    extractStringConstants(constantPool, methods) {
        const stringConstants = [];
        const ldcReferences = new Set(); // 记录被LDC引用的常量
        
        // 第一步：分析所有方法的字节码，找到LDC引用
        if (methods) {
            methods.forEach(method => {
                if (method.attributes) {
                    method.attributes.forEach(attr => {
                        // 查找Code属性
                        const nameConstant = constantPool[attr.nameIndex];
                        if (nameConstant && nameConstant.text === 'Code') {
                            try {
                                const codeAttr = this.parseCodeAttribute(attr.info, constantPool);
                                const ldcInstructions = this.findLdcInstructions(codeAttr.code);
                                
                                ldcInstructions.forEach(ldc => {
                                    ldcReferences.add(ldc.index);
                                });
                            } catch (e) {
                                // 忽略解析错误
                            }
                        }
                    });
                }
            });
        }
        
        // 第二步：收集被LDC引用的字符串常量
        constantPool.forEach((constant, index) => {
            if (!constant) return;
            
            if (constant.tag === 8) { // CONSTANT_String
                // 检查这个字符串常量是否被LDC引用
                if (ldcReferences.has(index)) {
                    const utf8Index = constant.stringIndex;
                    const utf8Constant = constantPool[utf8Index];
                    if (utf8Constant && utf8Constant.tag === 1) {
                        stringConstants.push({
                            stringConstantIndex: index,
                            utf8ConstantIndex: utf8Index,
                            text: utf8Constant.text,
                            isLdcReferenced: true
                        });
                    }
                }
            } else if (constant.tag === 1) { // CONSTANT_Utf8
                // 检查这个UTF-8常量是否被LDC直接引用
                if (ldcReferences.has(index)) {
                    stringConstants.push({
                        stringConstantIndex: null,
                        utf8ConstantIndex: index,
                        text: constant.text,
                        isLdcReferenced: true
                    });
                }
            }
        });
        
        return stringConstants;
    }

    // 简化的字段、方法、属性解析（保持原始字节码）
    parseFields(reader, count, constantPool) {
        const fields = [];
        for (let i = 0; i < count; i++) {
            const startPos = reader.position;
            const accessFlags = reader.readU2();
            const nameIndex = reader.readU2();
            const descriptorIndex = reader.readU2();
            const attributesCount = reader.readU2();
            
            const attributes = [];
            for (let j = 0; j < attributesCount; j++) {
                const attrNameIndex = reader.readU2();
                const attrLength = reader.readU4();
                const attrInfo = reader.readBytes(attrLength);
                attributes.push({
                    nameIndex: attrNameIndex,
                    length: attrLength,
                    info: attrInfo
                });
            }

            const endPos = reader.position;
            const rawBytes = reader.bytecode.slice(startPos, endPos);

            fields.push({
                accessFlags,
                nameIndex,
                descriptorIndex,
                attributes,
                rawBytes
            });
        }
        return fields;
    }

    parseMethods(reader, count, constantPool) {
        const methods = [];
        for (let i = 0; i < count; i++) {
            const startPos = reader.position;
            const accessFlags = reader.readU2();
            const nameIndex = reader.readU2();
            const descriptorIndex = reader.readU2();
            const attributesCount = reader.readU2();
            
            const attributes = [];
            for (let j = 0; j < attributesCount; j++) {
                const attrNameIndex = reader.readU2();
                const attrLength = reader.readU4();
                const attrInfo = reader.readBytes(attrLength);
                attributes.push({
                    nameIndex: attrNameIndex,
                    length: attrLength,
                    info: attrInfo
                });
            }

            const endPos = reader.position;
            const rawBytes = reader.bytecode.slice(startPos, endPos);

            methods.push({
                accessFlags,
                nameIndex,
                descriptorIndex,
                attributes,
                rawBytes
            });
        }
        return methods;
    }

    parseAttributes(reader, count, constantPool) {
        const attributes = [];
        for (let i = 0; i < count; i++) {
            const nameIndex = reader.readU2();
            const length = reader.readU4();
            const info = reader.readBytes(length);
            attributes.push({
                nameIndex,
                length,
                info
            });
        }
        return attributes;
    }

    writeFields(writer, fields) {
        for (const field of fields) {
            writer.writeBytes(field.rawBytes);
        }
    }

    writeMethods(writer, methods) {
        for (const method of methods) {
            writer.writeBytes(method.rawBytes);
        }
    }

    writeAttributes(writer, attributes) {
        for (const attr of attributes) {
            writer.writeU2(attr.nameIndex);
            writer.writeU4(attr.length);
            writer.writeBytes(attr.info);
        }
    }
}

/**
 * 字节码读取器
 */
class BytecodeReader {
    constructor(bytecode) {
        this.bytecode = bytecode;
        this.position = 0;
    }

    readU1() {
        if (this.position >= this.bytecode.length) {
            throw new Error('字节码读取越界');
        }
        return this.bytecode[this.position++];
    }

    readU2() {
        const b1 = this.readU1();
        const b2 = this.readU1();
        return (b1 << 8) | b2;
    }

    readU4() {
        const b1 = this.readU2();
        const b2 = this.readU2();
        return (b1 << 16) | b2;
    }

    readFloat() {
        const bytes = this.readU4();
        const buffer = new ArrayBuffer(4);
        const view = new DataView(buffer);
        view.setUint32(0, bytes, false);
        return view.getFloat32(0, false);
    }

    readBytes(length) {
        if (this.position + length > this.bytecode.length) {
            throw new Error('字节码读取越界');
        }
        const result = this.bytecode.slice(this.position, this.position + length);
        this.position += length;
        return result;
    }
}

/**
 * 字节码写入器
 */
class BytecodeWriter {
    constructor() {
        this.data = [];
    }

    writeU1(value) {
        this.data.push(value & 0xFF);
    }

    writeU2(value) {
        this.writeU1((value >> 8) & 0xFF);
        this.writeU1(value & 0xFF);
    }

    writeU4(value) {
        this.writeU2((value >> 16) & 0xFFFF);
        this.writeU2(value & 0xFFFF);
    }

    writeFloat(value) {
        const buffer = new ArrayBuffer(4);
        const view = new DataView(buffer);
        view.setFloat32(0, value, false);
        this.writeU4(view.getUint32(0, false));
    }

    writeBytes(bytes) {
        for (let i = 0; i < bytes.length; i++) {
            this.writeU1(bytes[i]);
        }
    }

    toUint8Array() {
        return new Uint8Array(this.data);
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JavaBytecodeParser;
}
