import request from '@/utils/request.js';

/**
 * 图片上传工具类
 */
class SendPicture {
    
    /**
     * 选择并上传图片
     * @param {Object} options 配置选项
     * @param {Number} options.count 最多选择图片数量，默认1
     * @param {Array} options.sizeType 图片尺寸类型，默认['compressed']
     * @param {Array} options.sourceType 图片来源，默认['album', 'camera']
     * @returns {Promise} 返回上传结果
     */
    static async chooseAndUploadImage(options = {}) {
        const {
            count = 1,
            sizeType = ['compressed'],
            sourceType = ['album', 'camera']
        } = options;

        try {
            // 选择图片
            const chooseResult = await this.chooseImage({
                count,
                sizeType,
                sourceType
            });

            if (!chooseResult.tempFilePaths || chooseResult.tempFilePaths.length === 0) {
                throw new Error('未选择图片');
            }

            // 上传图片
            const uploadResults = [];
            for (const filePath of chooseResult.tempFilePaths) {
                const uploadResult = await this.uploadImage(filePath);
                uploadResults.push(uploadResult);
            }

            return {
                success: true,
                data: count === 1 ? uploadResults[0] : uploadResults,
                msg: '图片上传成功'
            };

        } catch (error) {
            console.error('选择并上传图片失败:', error);
            return {
                success: false,
                data: null,
                msg: error.message || '图片上传失败'
            };
        }
    }

    /**
     * 选择图片
     * @param {Object} options 选择配置
     * @returns {Promise} 选择结果
     */
    static chooseImage(options) {
        return new Promise((resolve, reject) => {
            uni.chooseImage({
                ...options,
                success: (res) => {
                    resolve(res);
                },
                fail: (err) => {
                    reject(new Error('选择图片失败: ' + (err.errMsg || err.message)));
                }
            });
        });
    }

    /**
     * 上传单张图片到服务器
     * @param {String} filePath 图片本地路径
     * @returns {Promise} 上传结果
     */
    static uploadImage(filePath) {
        return new Promise((resolve, reject) => {
            // 显示上传进度
            const uploadTask = uni.uploadFile({
                url: `${request.baseUrl}/news/upload-image`,
                filePath: filePath,
                name: 'image',
                // 不要手动设置Content-Type，让系统自动处理multipart边界
                success: (res) => {
                    try {
                        const data = JSON.parse(res.data);
                        if (data.code === 200) {
                            resolve({
                                success: true,
                                image_url: data.result.image_url,
                                original_name: data.result.original_name,
                                file_size: data.result.file_size
                            });
                        } else {
                            reject(new Error(data.msg || '上传失败'));
                        }
                    } catch (error) {
                        reject(new Error('解析上传结果失败'));
                    }
                },
                fail: (err) => {
                    reject(new Error('网络上传失败: ' + (err.errMsg || err.message)));
                }
            });

            // 监听上传进度
            uploadTask.onProgressUpdate((res) => {
                console.log('上传进度:', res.progress + '%');
                // 可以在这里显示上传进度
                uni.showLoading({
                    title: `上传中 ${res.progress}%`
                });
            });
        });
    }

    /**
     * 发送图片消息
     * @param {Object} params 发送参数
     * @param {String} params.senderId 发送者ID
     * @param {String} params.receiverId 接收者ID
     * @param {String} params.imageUrl 图片URL
     * @param {String} params.content 消息内容（可选）
     * @returns {Promise} 发送结果
     */
    static async sendImageMessage(params) {
        const {
            senderId,
            receiverId,
            imageUrl,
            content = '[图片]'
        } = params;

        try {
            const response = await request.post('/news/messages', {
                senderId,
                receiverId,
                messageType: 'image',
                content,
                imageUrl
            });

            return {
                success: response.success === '成功',
                data: response.result,
                msg: response.msg || (response.success === '成功' ? '发送成功' : '发送失败')
            };
        } catch (error) {
            console.error('发送图片消息失败:', error);
            return {
                success: false,
                data: null,
                msg: '发送失败'
            };
        }
    }

    /**
     * 完整的选择、上传并发送图片流程
     * @param {Object} params 参数
     * @param {String} params.senderId 发送者ID
     * @param {String} params.receiverId 接收者ID
     * @param {Object} params.chooseOptions 选择图片配置
     * @returns {Promise} 处理结果
     */
    static async chooseUploadAndSend(params) {
        const {
            senderId,
            receiverId,
            chooseOptions = {}
        } = params;

        try {
            // 1. 选择并上传图片
            uni.showLoading({ title: '选择图片中...' });
            const uploadResult = await this.chooseAndUploadImage(chooseOptions);
            
            if (!uploadResult.success) {
                uni.hideLoading();
                throw new Error(uploadResult.msg);
            }

            // 2. 发送图片消息
            uni.showLoading({ title: '发送中...' });
            const sendResult = await this.sendImageMessage({
                senderId,
                receiverId,
                imageUrl: uploadResult.data.image_url
            });

            uni.hideLoading();

            if (sendResult.success) {
                uni.showToast({
                    title: '发送成功',
                    icon: 'success'
                });
                return {
                    success: true,
                    data: {
                        upload: uploadResult.data,
                        message: sendResult.data
                    },
                    msg: '图片发送成功'
                };
            } else {
                throw new Error(sendResult.msg);
            }

        } catch (error) {
            uni.hideLoading();
            uni.showToast({
                title: error.message || '操作失败',
                icon: 'none'
            });
            
            return {
                success: false,
                data: null,
                msg: error.message || '操作失败'
            };
        }
    }

    /**
     * 获取图片完整URL
     * @param {String} imageUrl 图片路径
     * @returns {String} 完整URL
     */
    static getImageUrl(imageUrl) {
        if (!imageUrl) return '';
        
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            return imageUrl;
        }
        
        if (imageUrl.startsWith('uploads/')) {
            return `${request.baseUrl}/${imageUrl}`;
        }
        
        return imageUrl;
    }
}

export default SendPicture;
