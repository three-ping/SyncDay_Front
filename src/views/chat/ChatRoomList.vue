<!-- ChatRoomList.vue --> 
<template>
    <div>
      <div v-if="isVisible" class="popup">
        <button class="close-button" @click="emit('closePopup')">X</button>
        <div class="popup-content">
          <p>채팅</p>
          <div class="newchat">
            <button class="new-chat" @click="createNewChatRoom"> 새 채팅  </button>
            </div>
            <div class="search">
              <input class="chat-search" type="text" placeholder=" 채팅방 명 검색 " @input="searchChat($event)"/>
            </div>
            <div class= "chatlist">
               <div v-for="chat in filterChatList" :key="chat.roomId" @click="openChatRoom(chat)" class="chat-room">
                <div class="profile-line">
                  <img :src="userProfileImg" alt="프로필 이미지" class="profile-img"/>
                  <div class="profile-content">
                  <span class="roomName-time">{{ chat.chatRoomName }}</span>
                  <span class="time">{{ chat.sentTime }}</span>
                  <div class="content">
                  <span class="lastMessage">{{ chat.lastMessage }}</span>
                  </div>
                </div>
              </div>
          </div>
            </div>
          </div>
        </div>
        <NewChatRoom v-if="isPopupVisible" @close="closeNewChatRoom" @chatCreated="addNewChat"/>
        <ChatRoom  v-if="selectedRoom" :roomId="selectedRoom.roomId"
        :chatRoomName="selectedRoom.chatRoomName"  
        @close="closeChatRoom" :removeChatFromList="removeChatFromList" @updateLastMessage="updateLastMessage"/>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onUnmounted, computed } from 'vue';
  import { useAuthStore } from '@/stores/auth';
  import axios from 'axios';
  import NewChatRoom from '@/views/chat/chat_components/NewChatRoom.vue';
  import ChatRoom from './ChatRoom.vue';

  const { isVisible } = defineProps({
    isVisible: {
      type: Boolean,
      required: true
    }, 
  })
  const roomId = ref('');

  const emit = defineEmits(['closePopup'])

const chatList = ref([]);   
const searchQuery = ref(''); 
const isPopupVisible = ref(false);
const selectedRoom = ref(null);
const authStore = useAuthStore();

// 새채팅 모달
const createNewChatRoom = () => {
  console.log('새 채팅방 생성 모달!');
  isPopupVisible.value = true
}

const addNewChat = (newRoom) => {
  newRoom.lastMessage = newRoom.lastMessage;
  chatList.value.unshift(newRoom)
  isPopupVisible.value = false
  openChatRoom(newRoom)
}
const closeNewChatRoom = () => {
  console.log('새채팅 모달 종료')
  isPopupVisible.value = false;
}
// 채팅방 열기
const openChatRoom = (chat) => {
  console.log('chat오픈: ', chat);
  if (chat && chat.roomId) { // 방어적 코드를 추가
    console.log(`${chat.roomId}번 채팅방 열기`);
    selectedRoom.value = chat;
    roomId.value = chat.roomId;
  } else {
    console.error("유효하지 않은 채팅 데이터:", chat);
  }
};

// 채팅방 닫기
const closeChatRoom = () => {
  selectedRoom.value = null;
};

// 새 채팅 메세지 업데이트
const updateLastMessage = ({ roomId, lastMessage, sentTime }) => {
  const room = chatList.value.find((chat) => chat.roomId === roomId);
  if (room) {
    room.lastMessage = lastMessage;
  }
};

// 채팅방 목록 데이터 가져오기
const fetchChatRooms = async () => {
  try {
    console.log('authStore.user.userId:', authStore.user.userId); 
    const response = await axios.get('/chat/room',{params: { userId: authStore.user.userId}});
    console.log('API 요청 URL: ', axios.defaults.baseURL + '/chat/room');
    console.log('응답데이터: ', response.data)
    if (Array.isArray(response.data)) {
      chatList.value = response.data || [];
    } else {
      console.error('예상치 못한 응답 데이터 형식:', response.data);
      chatList.value = [];
    }
  } catch (error) {
    console.error('채팅방 목록을 가져오는 중 오류 발생:', error.message);
    chatList.value = [];
  }
};


// 채팅방 필터링
const filterChatList = computed(() => {
  if (!Array.isArray(chatList.value) || chatList.value.length === 0) {
    return []; 
  }
  
  return chatList.value.map((chat) => {
    const userName = authStore.user.userName; // 로그인한 유저 이름
    const filteredName = chat.chatRoomName.replace(userName, '').trim(); // 유저 이름을 제거(,(쉼표)도 제거 필요(수정 예정) )
    return {
      ...chat,
      chatRoomName: filteredName
    };
  }).filter((chat) =>
    chat.chatRoomName?.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// 검색 필터링
const searchChat = (event) => {
  if (event && event.target && event.target.value) {
    searchQuery.value = event.target.value.toLowerCase();
  } else {
    console.error("유효하지 않은 검색:", event);
  }};

  // 채팅방 삭제
  const removeChatFromList = (roomId) => {
    chatList.value = chatList.value.filter((chat) => chat.roomId !== roomId);
    console.log(`채팅 목록에서 ${roomId} 삭제`);
  };

// 컴포넌트가 로드될 때 데이터 가져오기
onMounted(() => {
  console.log("해당 유저 정보", authStore.user.userId)
  console.log('마운트: ', roomId)
  fetchChatRooms();
});

onUnmounted(() => {
  console.log(`채팅방 ${roomId}의 모든 데이터 초기화`);

});
  </script>
  
  <style scoped>
  .popup {
    position: absolute;
    top: 50px; /* 아이콘 아래로 50px */
    left: 85%;
    transform: translateX(-50%);
    width: 30rem;
    height: 60%;
    background-color: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    z-index: 1000;
  }
  
  /* 팝업 콘텐츠 */
  .popup-content {
    padding: 10px;
    overflow-y: auto;
    height: calc(100% - 20px);
  }
  
  .popup-content p {
    font-size: 2rem;
    font-weight: bold;
    margin: 1rem;
    margin-bottom: 0rem;
  }
  
  .closePopup {
    size: 2rem;
  }
  .close-button {
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    font-size: 0.8rem;
    cursor: pointer;
    color: #c7c5c5;
  }
  
  .close-button:hover {
    color: #686666;
  }
  
  .chatlist {
  flex-direction: column;
  flex-grow: 1;
  gap: 7px;
  padding: 7px;
  border-radius: 5px;
  }

  .popup ::-webkit-scrollbar {
  width: 8px; /* 세로 스크롤바 크기 */
  height: 8px; /* 가로 스크롤바 크기 */
}

/* 스크롤바의 막대 */
.popup ::-webkit-scrollbar-thumb {
  background-color: #fdebf1; /* 색상 */
  border-radius: 4px; /* 둥근 모서리 */
}
  .new-chat {
  background-color: #20c2a4;
  border-radius: 13px;
  font-size: 1rem;
  color: #fff2f2;
  border: none;
  cursor: pointer;
  margin-bottom: 0.5rem;
  margin-left: 22rem;
}

.new-chat:hover {
  background-color: #10c2a1;
}

  .chat-room {
    border-bottom: 1px solid #ddd;
    padding: 10px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .chat-room:hover {
    background-color: #f5f5f5;
  }
  
  .chat-room h4 {
    margin: 0;
    font-size: 16px;
  }
  
  .chat-room p {
    margin: 5px 0 0;
    font-size: 5%;
    color: #666;
  }
  
  .chat-search {
    border-radius: 7px;
    border-style: solid;
    background-color: #f5f5f5 ;
    border-color: #d1d1d1;
    font-size: 0.9rem;
    width: 90%;
    margin-left: 1.5rem;
  }
  .chatlist {
  margin-top: 1rem;
}
.roomName {
  font-size: 15px;
}
.lastMessage {
  font-size: 11px;
  color: #444444;
}
.profile-line {
  display: flex;
  gap: 10px;
  align-items: start
}
.profile-img{
  width: 40px;
  height: 40px;
}
.content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
  </style>