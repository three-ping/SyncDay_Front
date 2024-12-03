<template>
    <div class="modal-container" @click="handleOutsideClick">
        <div class="modal-content">
            <div class="modal-header">
                <span class="pi pi-pencil" @click="openEditModal"></span>
                <span class="pi pi-trash" @click="deleteSchedule(scheduleId)"></span>
                <span class="pi pi-times" @click="$emit('close')"></span>
            </div>
            <CalendarModal 
                v-if="isEditModalOpen"
                :schedule="schedule"
                :isEditMode="true"
                @close="$emit('close')"
                @submit="$emit('submit')"
            />
            <div class="modal-schedule">
                <!-- 제목 및 날짜 -->
                <div>
                    <div>
                        {{ title }}
                    </div>
                    <div>
                        {{ formattedDate }}
                    </div>
                    <div></div>
                </div>

                <!-- 내용 -->
                <div>{{ content }}</div>

                <!-- 공개 여부 -->
                <div>{{ publicStatus == 'PUBLIC' ? '공개' : '비공개' }}</div>

                <!-- 회의 여부 -->
                <div>{{ meetingStatus == 'ACTIVE' ? '회의' : null }}</div>

                <!-- 회의실 있으면 회의랑 같이 보여주기 -->

                <!-- 주최자 -->
                <div>{{ username }}</div>

                <!-- 알람 (없으면 여기서 추가할 수 있게) -->

            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, defineProps } from 'vue';
import CalendarModal from './CalendarModal.vue';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc'; // UTC 플러그인
import timezone from 'dayjs/plugin/timezone'; // 타임존 플러그인
import duration from 'dayjs/plugin/duration';
import 'dayjs/locale/ko';
import axios from 'axios';

dayjs.extend(utc); // UTC 플러그인 사용
dayjs.extend(timezone); // 타임존 플러그인 사용
dayjs.extend(duration);
dayjs.locale('ko');

const props = defineProps({
    schedule: {
        type: Object,
        required: true,
    },
});

// props로 받는 값!
const schedule = props.schedule;
console.log('schedule', schedule);

const scheduleId = props.schedule.scheduleId;
const title = props.schedule.title;
const content = props.schedule.content;
const startTime = props.schedule.startTime;
const endTime = props.schedule.endTime;
// const updateTime = props.schedule.updateTime;
const publicStatus = props.schedule.publicStatus;
// const scheduleRepeatId = props.schedule.scheduleRepeatId;
// const repeatOrder = props.schedule.repeatOrder;
const meetingStatus = props.schedule.meetingStatus;
const meetingroomId = props.schedule.meetingroomId;
// const userId = props.schedule.userId;
const username = props.schedule.username;
const userInfo = props.schedule.userInfo;       // 이걸로 참석자 확인!!
const notificationTime = props.schedule.notificationTime;

console.log('userInfo', userInfo);

const emit = defineEmits(['close', 'submit']);

const handleOutsideClick = (event) => {
    if (event.target === event.currentTarget) {
        emit('close');
    }
};

const isEditModalOpen = ref(false);

const openEditModal = () => {
    isEditModalOpen.value = true;
    // emit('close');
}

// 종일 체크 여부
const isAllDay = ref(dayjs(startTime).format('HH:mm') === '00:00' && dayjs(endTime).format('HH:mm') === '00:00');

// 현재 연도
const currentYear = dayjs().year();

const formattedDate = computed(() => formatDate(startTime, endTime, isAllDay.value));

// 날짜 포맷팅 함수
function formatDate(startTime, endTime, isAllDay) {
    const start = dayjs(startTime);
    const end = dayjs(endTime);

    // Helper: 요일 포맷
    const getWeekday = (date) => `(${dayjs(date).format('dddd')})`;

    // 1. `isAllDay`인 경우
    if (isAllDay) {
        // 1-1. 하루 차이인 경우
        if (start.isSame(end, 'day')) {
            return start.year() === currentYear
                ? `${start.format('MM월 DD일')} ${getWeekday(start)}`
                : `${start.format('YYYY년 M월 DD일')} ${getWeekday(start)}`;
        }

        // 1-2. 이틀 이상 차이인 경우
        const startFormatted =
            start.year() === currentYear ? `${start.format('MM월 DD일')}` : `${start.format('YYYY년 MM월 DD일')}`;
        const endFormatted =
            end.year() === currentYear
                ? end.month() === start.month()
                    ? `${end.format('DD일')}`
                    : `${end.format('MM월 DD일')}`
                : `${end.format('YYYY년 MM월 DD일')}`;

        return `${startFormatted} - ${endFormatted}`;
    }

    // 2. `isAllDay`가 아닌 경우
    if (!isAllDay) {
        // 2-1. 같은 날
        if (start.isSame(end, 'day')) {
            const startPeriod = start.format('A'); // 오전/오후
            const endPeriod = end.format('A');
            const showEndPeriod = startPeriod !== endPeriod; // 시간대가 다르면 표시

            const timeRange = showEndPeriod
                ? `${start.format('A hh:mm')} - ${end.format('A hh:mm')}`
                : `${start.format('A hh:mm')} - ${end.format('hh:mm')}`;

            return start.year() === currentYear
                ? `${start.format('MM월 DD일')} ${getWeekday(start)} • ${timeRange}`
                : `${start.format('YYYY년 M월 DD일')} ${getWeekday(start)} • ${timeRange}`;
        }

        // 2-2. 다른 날
        return `${start.format('YYYY년 M월 DD일')}, ${start.format('A hh:mm')} - ${end.format(
            'YYYY년 M월 DD일'
        )}, ${end.format('A hh:mm')}`;
    }

    return '';
}

// 삭제 메소드
const deleteSchedule = async (scheduleId) => {
    try {
        // DELETE 요청 보내기
        const response = await axios.delete(`/schedule/${scheduleId}`);
        console.log('삭제 성공:', response.data);

        emit('close');
        emit('submit');

        // 성공 알림 (선택 사항)
        alert('스케줄이 삭제되었습니다.');
    } catch (error) {
        console.error('삭제 실패:', error.response?.data || error.message);

        // 실패 알림
        alert('스케줄 삭제에 실패했습니다. 다시 시도해주세요.');
    }
};
</script>

<style scoped>
.modal-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background-color: white;
    padding: 2rem;
    border-radius: 8px;
    width: 80%;
    max-width: 500px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    position: relative;
}

.modal-header {
    display: flex;
    justify-content: flex-end;
    gap: 2rem;
}

.modal-header .pi {
    font-size: 1.5rem;
    cursor: pointer;
}
</style>
