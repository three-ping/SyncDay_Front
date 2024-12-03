<template>
    <div v-if="isAssistantVisible" class="assistant-container">
    <div class="assistant-balloon">
        <div class="tab-button-container">
            <button :class="{ active: tab === 'today' }" @click="selectTab('today')">
                오늘의 일정
            </button>
            <button :class="{ active: tab === 'notified' }" @click="selectTab('notice')">
                일정 알림
            </button>
        </div>
        <div v-if="tab == 'today'" class="today-schedule">
            <p>반갑습니다! Syncday 비서 문어입니다.</p>
            <p>오늘의 일정을 안내드립니다.</p>
            <div class="today-schedule-container">
                <table class="today-schedule-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Start Time</th>
                            <th>End Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(schedule, index) in todaySchedules" :key="index"
                        :class="{'past-schedule': isPastSchedule(schedule.start_time)}">
                            <td>{{ schedule.title }}</td>
                            <td>{{ formatDate(schedule.start_time) }}</td>
                            <td>{{ formatDate(schedule.end_time) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div v-if="tab == 'notice'" class="notice-schedule">
            <p>안녕하세요.</p>
            <div v-if="notiedSchedules.length >0 ">
                <p>다음 일정이 곧 시작됩니다.</p>
                <table class="notice-schedule-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Start Time</th>
                            <th>End Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(schedule, index) in notiedSchedules" :key="index">
                            <td>{{ schedule.title }}</td>
                            <td>{{ formatDate(schedule.start_time) }}</td>
                            <td>{{ formatDate(schedule.end_time) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div v-else>
                <p>아직 알림드릴 일정이 없습니다.</p>
            </div>
        </div>
        <button @click="hide">닫기</button>
        <div class="assistant-balloon-tail"></div>
    </div>
    <div class="assistant-avatar">
        <img src="@/assets/images/assistant.png" alt="Assistant" />
    </div>
    </div>
    <div v-else class="assistant-button-container" @click="show">
    <img  alt="누르면 비서가 나오는 이미지" />
    </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, computed,watch } from 'vue';
import { useAssistantStore } from '@/stores/assistant';
import { useAuthStore } from '@/stores/auth';
import { EventSourcePolyfill } from 'event-source-polyfill';

const assistantStore = useAssistantStore();
const authStore = useAuthStore();
const isAssistantVisible = ref(false);

const todaySchedules = computed(() => assistantStore.todaySchedules);
const notiedSchedules = computed(() => assistantStore.notiedSchedules);

const tab = ref("today");

const isPastSchedule = (start_time) => {
    const startTime = new Date(start_time);
    const now = new Date();
    return startTime < now;
};

const formatDate = (dateString) => {
    const date = new Date(dateString);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12; 

    return `${year}-${month}-${day} ${ampm} ${String(hours).padStart(2, '0')}:${minutes}`;
};
const selectTab = (selectedTab) => {
    tab.value = selectedTab;
}
const hide = () => {
    isAssistantVisible.value = false;
};
const show = () => {
    isAssistantVisible.value = true;
};

const eventSource = ref(null);

const connect = (userId, token) => {
if (eventSource.value) {
    console.log("SSE already connected");
    return;
}

eventSource.value = new EventSourcePolyfill(
    `http://localhost:8080/sse/notification/subscribe/${authStore.user.userId}`,
    // `http://localhost:5000/sse/notification/subscribe/1`,
    {
    headers: {
        Authorization: `Bearer ${token}`,
        
    },
    connectionTimeout: 24*60*1000, 
    heartbeatTimeout: 24*60*1000, 
    }
);

eventSource.value.onmessage = (event) => {
    console.log("Received event:", event.data);
    assistantStore.getNotiedSchedule(JSON.parse(event.data));
    tab.value = "notice";
    isAssistantVisible.value = true;
};

const MAX_RETRY = 5;
let retryCount = 0;
let isConnecting = false;

eventSource.value.onerror = (error) => {
    console.error("SSE connection error:", error);
    disconnect();

    if (retryCount >= MAX_RETRY) {
        console.error("Max retry attempts reached. Stopping reconnection.");
        return;
    }

    if (isConnecting) return; // 중복 방지
    isConnecting = true;

    const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 30000);
    console.log(`Reconnecting in ${retryDelay / 1000} seconds...`);

    setTimeout(() => {
        connect(userId, token);
        retryCount++;
        isConnecting = false;
    }, retryDelay);
};

};

const disconnect = () => {
if (eventSource.value) {
    eventSource.value.close();
    eventSource.value = null;
    console.log("SSE disconnected");
}
};


onMounted(()=>{
    const userId = authStore.user.userId;
    const token = authStore.accessToken;

    if(assistantStore.isFirst){
        assistantStore.initialize(userId);
        isAssistantVisible.value = true;
    }

    connect(userId,token);
    console.log("sse 연결 시도");
})
onUnmounted(()=>{
    disconnect();
})
</script>

<style scoped>

.assistant-container {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 1;
}

/* 비서 아바타 */
.assistant-avatar {
    width: 7rem;
    height: 7rem;
    border-radius: 50%;
    overflow: hidden;
}

.assistant-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

/* 말풍선 스타일 */
.assistant-balloon {
    position: relative;
    margin-top: 8px;
    background-color: #ffffff;
    border-radius: 16px;
    padding: 12px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    max-width: 30rem;
    text-align: left;
    font-size: 14px;
    color: #333333;
    border: 1px solid #ddd;
    display: flex;
    flex-direction: column;
    align-items: center;
}

/* 말풍선 꼬리 */
.assistant-balloon-tail {
    position: absolute;
    bottom: -12px;
    left: 20px;
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 12px 12px 0;
    border-color: #ffffff transparent transparent transparent;
}

/* 닫기 버튼 */
.assistant-balloon button {
    margin-top: 8px;
    background-color: #007bff;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
}

.assistant-balloon button:hover {
    background-color: #0056b3;
}

/* 비서 버튼 컨테이너 */
.assistant-button-container {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    width: 60px;
    height: 60px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    background-color: #ffffff;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    cursor: pointer;
    z-index: 1;
}

.assistant-button-container img {
    width: 40px;
    height: 40px;
    object-fit: contain;
}

.past-schedule {
  color: grey;
}
</style>
