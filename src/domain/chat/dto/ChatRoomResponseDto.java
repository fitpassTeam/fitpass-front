public record ChatRoomResponseDto(
    Long chatRoomId,
    Long userId,
    Long gymId,
    String userName,
    String userImage,
    String gymName,
    String gymImage,
    String content,
    SenderType senderType
) {
    public static ChatRoomResponseDto from(ChatRoom chatRoom, ChatMessage lastMessage){
        return new ChatRoomResponseDto(
            chatRoom.getId(),
            chatRoom.getUser().getId(),
            chatRoom.getGym().getId(),
            chatRoom.getUser().getName(),
            chatRoom.getUser().getImageUrl(),
            chatRoom.getGym().getName(),
            chatRoom.getGym().getImageUrl(),
            lastMessage != null ? lastMessage.getContent() : null,
            lastMessage != null ? lastMessage.getSenderType() : null
        );
    }
} 