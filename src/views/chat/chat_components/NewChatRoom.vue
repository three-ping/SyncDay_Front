<!-- NewChatRoom.vue -->
<template>
  <div class="modal" draggable="true">
    <div class="modal-content">
      <button class="close-button" @click="$emit('close')">X</button>
      <p>새 채팅방 만들기</p>

      <div v-if="isLoading">로딩 중...</div>
      <div v-else>
      <!-- 멤버 검색 및 선택 -->
      <div class="member-selection">
        <div class="search-container">
          <input
            id="search"
            type="text"
            v-model="searchQuery"
            placeholder="멤버 이름 검색"
            class="search-input"
          />
        </div>
        <div class="user-list">
          <!-- 스크롤 가능한 멤버 리스트 -->
          <div class="scrollable-list">
            <label
              v-for="user in filteredUsers"
              :key="user.userId"
              class="user-item"
            >
              <input
                type="checkbox"
                :value="user.userId"
                v-model="selectedMembers"
                class="user-check"
              />
              <span class="user-check-circle"></span>
              {{ user.name }}
            </label>
          </div>
        </div>
        </div>
      </div>

      <!-- 생성 버튼 -->
      <button class="create-new" @click="createNewChat">생성</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import axios from "axios";
import { useAuthStore } from '@/stores/auth';

// 상태 관리
const users = ref([]); // 사용자 목록
const searchQuery = ref(""); // 검색어
const selectedMembers = ref([]); // 선택된 멤버
const authStore = useAuthStore();
const currentUserId = ref(authStore.user?.userId);
const chatRoomName = ref(""); // 채팅방 이름
const isLoading = ref(true);
const emit = defineEmits(["chatCreated","close"]);

// 사용자 목록 로드
async function loadUsers() {
  console.log("유저 목록 불러오기")
  try {
    const response = await axios.get("http://localhost:5000/api/user/select"); // API 주소 확인
    console.log("api 응답",response.data )
    users.value = response.data.data.filter(user => user.userId !== currentUserId.value);
    console.log("필터링된 사용자 목록: ", users.value)
  } catch (error) {
    console.error("사용자 불러오기 실패:", error.response || error.message);
  } finally {
    isLoading.value = false;
  }
}

// 검색 필터
const filteredUsers = computed(() => {
  if (Array.isArray(users.value)) {
    return users.value.filter(user =>
      user.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  } else {
    return [];
  }
});


// 새 채팅방 생성
async function createNewChat() {
  try {
    if (selectedMembers.value.length === 0) {
      alert("채팅할 멤버를 선택해주세요");
      return;
    }

    const response = await axios.post("http://localhost:5000/api/chat/room/create", {
      chatRoomName: chatRoomName.value,
      memberIds: selectedMembers.value,
    });
    console.log("응답 데이터 확인: ",response)

    const newRoom = {
      roomId: response.data?.data?.roomId || response.data?.roomId,
      chatRoomName: chatRoomName.value,
      lastMessage: "",
    };

    console.log("새 채팅방 생성: ", newRoom)
    emit("chatCreated", newRoom)
    emit("close");
  } catch (error) {
    console.error("채팅방 생성 실패:", error);
    alert("채팅방 생성에 실패하였습니다. 다시 시도해주세요.");
  }
}

// 멤버 선택 시 채팅방 이름 업데이트
watch(selectedMembers, (newMembers) => {
  const memberNames = users.value
    .filter((user) => newMembers.includes(user.userId))
    .map((user) => user.name);
  chatRoomName.value = memberNames.join(", ") || "새 채팅방";
});

// 초기 사용자 로드
loadUsers();
</script>

<style scoped>
/* 모달 전체 스타일 */
.modal {
  position: absolute;
  top: 40%;
  left: 85%;
  transform: translate(-50%, -50%);
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  width: 400px;
  max-height: 500px;
  z-index: 2000;
  overflow: hidden;
}

.modal-content p {
  font-size: 20px;
  font-weight: 400;
  color: #383838;
  margin-bottom: 15px;
  margin-left: 20px;
}
/* 닫기 버튼 */
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
  color: #555;
}


/* 멤버 선택 스타일 */
.member-selection {
  width: 100%;
  margin-bottom: 20px;
}
.search-container {
  margin-bottom: 10px;
}
.search-input {
  width: 100%;
  padding: 8px;
  font-size: 1rem;
  border: 1px solid #ddd;
  border-radius: 10px;
}
/* 체크박스 숨기기 */
.user-check {
  display: none;
}

/* 동그라미 체크박스 스타일 */
.user-check-circle {
  width: 10px;
  height: 10px;
  border: 2px solid #ddd;
  border-radius: 50%;
  display: inline-block;
  position: relative;
  margin-right: 10px;
  cursor: pointer;
  transition: border-color 0.3s ease;
}

/* 체크박스 선택 시 스타일 */
.user-check:checked + .user-check-circle {
  background-color: #c6f1e9;
  border-color: #6bdfc9;
  position: relative;
}

/* 동그라미 안 체크 표시 */
.user-check:checked + .user-check-circle::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 6px;
  /* background-color: #fff4f1; */
  border-radius: 50%;
}

/* 멤버 리스트 스크롤 */
.user-list .scrollable-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #ddd;
  padding: 8px;
  border-radius: 4px;
}
.scrollable-list::-webkit-scrollbar{
  width: 8px;
}
.scrollable-list::-webkit-scrollbar-thumb {
    background: #d6f5ef; /* 스크롤바 색상 */
    border-radius: 10px; /* 스크롤바 둥근 테두리 */
}
.scrollable-list::-webkit-scrollbar-track {
    background: #f5fdfc;
}
.user-item {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}
.user-item input {
  margin-right: 10px;
}

/* 생성 버튼 */
.create-new {
  background-color: #20c2a4;
  color: #fff2f2;
  padding: 3px 10px;
  font-size: 1rem;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  display: block;
  margin: 0 auto;
}
.create-new:hover {
  background-color: #10c2a1;
}
</style>