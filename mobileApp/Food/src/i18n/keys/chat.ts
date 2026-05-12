export type ChatKey =
  | 'chat.cannotLoadMessages'
  | 'chat.permissionRequired'
  | 'chat.photoPermissionMsg'
  | 'chat.limitReached'
  | 'chat.maxFilesMsg'
  | 'chat.cannotPickImage'
  | 'chat.cannotPickFile'
  | 'chat.cannotOpenFile'
  | 'chat.deviceNotSupported'
  | 'chat.sendFailed'
  | 'chat.cannotSendMessage'
  | 'chat.missingConversation'
  | 'chat.goBack'
  | 'chat.typing'
  | 'chat.inputPlaceholder'
  | 'chat.noMessages'
  | 'chat.imageLabel'
  | 'chat.fileLabel'
  | 'chat.tapToOpen';

export const chatEn: Record<ChatKey, string> = {
  'chat.cannotLoadMessages': 'Cannot load messages',
  'chat.permissionRequired': 'Permission Required',
  'chat.photoPermissionMsg': 'You need to grant photo library permission to send images.',
  'chat.limitReached': 'Limit Reached',
  'chat.maxFilesMsg': 'Each message can have at most 5 files.',
  'chat.cannotPickImage': 'Cannot Select Image',
  'chat.cannotPickFile': 'Cannot Select File',
  'chat.cannotOpenFile': 'Cannot Open File',
  'chat.deviceNotSupported': 'This device cannot open this link.',
  'chat.sendFailed': 'Failed to send message.',
  'chat.cannotSendMessage': 'Cannot Send Message',
  'chat.missingConversation': 'Missing conversation info.',
  'chat.goBack': 'Go Back',
  'chat.typing': 'Typing...',
  'chat.inputPlaceholder': 'Type a message...',
  'chat.noMessages': 'No messages yet.',
  'chat.imageLabel': 'Image',
  'chat.fileLabel': 'File',
  'chat.tapToOpen': 'Tap to open',
};

export const chatVi: Record<ChatKey, string> = {
  'chat.cannotLoadMessages': 'Không tải được tin nhắn',
  'chat.permissionRequired': 'Thiếu quyền',
  'chat.photoPermissionMsg': 'Bạn cần cấp quyền thư viện ảnh để gửi ảnh.',
  'chat.limitReached': 'Đã đạt giới hạn',
  'chat.maxFilesMsg': 'Mỗi tin nhắn chỉ gửi tối đa 5 tệp.',
  'chat.cannotPickImage': 'Không thể chọn ảnh',
  'chat.cannotPickFile': 'Không thể chọn file',
  'chat.cannotOpenFile': 'Không thể mở tệp',
  'chat.deviceNotSupported': 'Thiết bị không hỗ trợ mở liên kết này.',
  'chat.sendFailed': 'Gửi tin nhắn thất bại.',
  'chat.cannotSendMessage': 'Không gửi được tin nhắn',
  'chat.missingConversation': 'Thiếu thông tin cuộc trò chuyện.',
  'chat.goBack': 'Quay lại',
  'chat.typing': 'Đang nhập...',
  'chat.inputPlaceholder': 'Nhập tin nhắn...',
  'chat.noMessages': 'Chưa có tin nhắn nào.',
  'chat.imageLabel': 'Ảnh',
  'chat.fileLabel': 'Tệp',
  'chat.tapToOpen': 'Nhấn để mở',
};
