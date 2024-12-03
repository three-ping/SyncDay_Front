<template>
    <div class="modal-container" @click="handleOutsideClick">
        <div class="modal-content">
            <!-- 닫기 버튼 -->
            <div class="close-btn">
                <span class="pi pi-times" @click="$emit('close')"></span>
            </div>

            <!-- 제목 -->
            <div class="title">
                <input v-model="title" class="title-input" placeholder="제목을 입력해주세요." />
            </div>

            <br />

            <!-- 날짜/시간 -->
            <div class="align-center">
                <span class="pi pi-clock"></span>
                <DatePicker v-model="startDate" dateFormat="mm월 dd일 (D)" size="large" @change="onStartDateChange" />
                <Select
                    v-if="isAllDay == false"
                    v-model="startDateTime"
                    :options="timeOptions"
                    option-label="label"
                    option-value="value"
                    placeholder="Select a time"
                    size="large"
                ></Select>
                <span style="margin-left: 0.5rem; margin-right: 0.5rem">ㅡ</span>
                <DatePicker v-model="endDate" :minDate="startDate" dateFormat="mm월 dd일 (D)" size="large" />
                <Select
                    v-if="isAllDay == false"
                    v-model="endDateTime"
                    :options="filteredEndTimeOptions"
                    option-label="label"
                    option-value="value"
                    placeholder="Select a time"
                    size="large"
                ></Select>
            </div>

            <!-- 종일 체크 -->
            <div style="margin-left: 3.5rem; margin-top: 0.7rem">
                <label>
                    <Checkbox v-model="isAllDay" binary />
                    종일
                </label>
            </div>

            <br />

            <!-- 내용 -->
            <div class="text">
                <Textarea v-model="content" placeholder="내용을 입력해주세요." />
            </div>

            <!-- 회의 토글 -->
            <div class="toggle-section">
                <div class="toggle-item">
                    <div class="toggle-label">
                        <img src="@/assets/images/meeting.svg" alt="meeting" class="icon" />
                        <span class="title-name">회의</span>
                        <ToggleSwitch v-model="isMeeting" />
                    </div>
                </div>
            </div>

            <!-- 회의실 -->
            <div v-if="isMeeting">
                <div class="description">
                    <!-- 회의실 조회해서 회의실 id 가져오게 해야한다. 이때 시간을 넘겨서 조회 -->
                    <span>회의실 추가</span>
                </div>
            </div>

            <!-- 공개 토글 -->
            <div class="toggle-section">
                <div class="toggle-item">
                    <div class="toggle-label">
                        <span class="pi pi-exclamation-circle"></span>
                        <span class="title-name">공개</span>
                        <ToggleSwitch v-model="isPublic" />
                    </div>
                </div>
            </div>
            <span class="description"> 공개는 타인이 본인의 일정 검색 시 보여지게 됩니다. </span>

            <!-- 참석자 -->
            <div class="toggle-section">
                <div class="align-center">
                    <span class="pi pi-users"></span>
                    <span class="title-name">참석자</span>
                </div>
            </div>
            <div class="indent">
                <!-- 엘라스틱 서치로 user_id를 리스트에 넣는다. -->
                <span>추가</span>
            </div>

            <!-- 알람 -->
            <!-- 시간에 대한 알람만 있다면 종일이 풀려서 시간이 보일 때 나타나게 해도 괜찮을 듯! -->
            <div v-if="isAllDay == false">
                <div class="toggle-section">
                    <div class="align-center">
                        <img src="@/assets/images/alarm-clock.svg" alt="alarm-clock" class="icon" />
                        <span class="title-name">알람</span>
                    </div>
                </div>
                <div>
                    <div class="indent" v-if="showSelectAlarm == false">
                        <span style="cursor: pointer" @click="showSelectAlarm = !showSelectAlarm">추가</span>
                    </div>
                    <!-- 알람 시간 선택 드롭다운 -->
                    <div v-if="showSelectAlarm" class="indent dropdown-container">
                        <Select
                            v-model="notificationTime"
                            :options="alarmOptions"
                            option-label="label"
                            option-value="value"
                            size="large"
                        />
                        <span class="pi pi-times" @click="showSelectAlarm = false"></span>
                    </div>
                </div>
            </div>

            <br />

            <!-- 버튼 영역 -->
            <div class="button-section">
                <Button label="취소" severity="secondary" @click="$emit('close')"></Button>
                <Button label="저장" severity="Danger" @click="submitSchedule"></Button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc'; // UTC 플러그인
import timezone from 'dayjs/plugin/timezone'; // 타임존 플러그인
import duration from 'dayjs/plugin/duration';
import 'dayjs/locale/ko';
import axios from 'axios';
import DatePicker from 'primevue/datepicker';
import Select from 'primevue/select';
import Checkbox from 'primevue/checkbox';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import ToggleSwitch from 'primevue/toggleswitch';
import 'primeicons/primeicons.css';
import { usePrimeVue } from 'primevue/config';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

dayjs.extend(utc); // UTC 플러그인 사용
dayjs.extend(timezone); // 타임존 플러그인 사용
dayjs.extend(duration);
dayjs.locale('ko');

const authStore = useAuthStore();
const router = useRouter();

const props = defineProps({
    schedule: {
        type: Object,
        required: true,
    },
    isEditMode: {
        type: Boolean,
        default: false,
    },
});

const handleOutsideClick = (event) => {
    if (event.target === event.currentTarget) {
        emit('close');
    }
};

const emit = defineEmits(['close', 'submit']);

console.log('모달로 넘어온 값:', props.schedule);

// 제목 부분
const title = ref(props.isEditMode ? props.schedule.title : null);

// 내용 부분
const content = ref(props.isEditMode ? props.schedule.content : null);

// 캘린더에서 받은 날짜
const start = ref(props.schedule.start); // 2024-12-02 13:00 /   2024-12-02 00:00
const end = ref(props.schedule.end); // 2024-12-02 14:00 /   2024-12-03 00:00

// 종일 체크 여부 -> 날짜냐? 날짜+시간이냐? 차이!!!!!!
const isAllDay = ref(
    props.isEditMode
        ? dayjs(props.schedule.startTime).format('HH:mm') === '00:00' &&
              dayjs(props.schedule.endTime).format('HH:mm') === '00:00'
        : dayjs(start.value).format('HH:mm') === '00:00' && dayjs(end.value).format('HH:mm') === '00:00'
);

// 회의 여부
const isMeeting = ref(props.isEditMode ? (props.schedule.meetingStatus === 'ACTIVE' ? true : false) : false);

// 공개 여부
const isPublic = ref(props.isEditMode ? (props.schedule.publicStatus === 'PUBLIC' ? true : false) : false);

// Main
// DatePicker와 v-binding
// 날짜 (YYYY-MM-DD) => Date 객체
// 시간 (HH:mm) => String
const startDate = ref(props.isEditMode ? props.schedule.startTime : start.value);
const startDateTime = ref(
    props.isEditMode ? dayjs(props.schedule.startTime).format('HH:mm') : dayjs(start.value).format('HH:mm')
);
const endDate = ref(
    props.isEditMode
        ? isAllDay.value
            ? new Date(new Date(props.schedule.endTime).setDate(new Date(props.schedule.endTime).getDate() - 1))
            : props.schedule.endTime
        : isAllDay.value
        ? new Date(new Date(end.value).setDate(new Date(end.value).getDate() - 1))
        : end.value
);
const endDateTime = ref(
    props.isEditMode ? dayjs(props.schedule.endTime).format('HH:mm') : dayjs(end.value).format('HH:mm')
);

// 종일 여부 변경 감지
watch(isAllDay, (newVal) => {
    if (newVal) {
        // True: 종일로 설정 -> 시간 모두 00:00으로
        startDateTime.value = '00:00';
        endDateTime.value = '00:00';

        showSelectAlarm.value = false;
    } else {
        // False: 시간 설정 -> 현재 시간 기준으로 다음 정시와 다다음 정시
        const now = dayjs();
        const nextHour = now.add(1, 'hour').startOf('hour'); // 가장 가까운 다음 정시
        const twoHoursLater = nextHour.add(1, 'hour'); // 다다음 정시

        startDateTime.value = nextHour.format('HH:mm'); // 다음 정시
        endDateTime.value = twoHoursLater.format('HH:mm'); // 다다음 정시
    }
});

// DB에 저장할 변수
// 날짜 (YYYY-MM-DD)
// 시간 (HH:mm)
const startDateRegist = computed(() => dayjs(startDate.value).format('YYYY-MM-DD'));
const startDateTimeRegist = computed(() => startDateTime.value);
const endDateRegist = computed(() =>
    isAllDay.value ? dayjs(endDate.value).add(1, 'day').format('YYYY-MM-DD') : dayjs(endDate.value).format('YYYY-MM-DD')
);
const endDateTimeRegist = computed(() => endDateTime.value);

const formData = computed(() => ({
    id: authStore.user.userId,
    title: title.value,
    content: content.value,
    startTime: `${startDateRegist.value}T${startDateTimeRegist.value}+09:00`,
    endTime: `${endDateRegist.value}T${endDateTimeRegist.value}+09:00`,
    publicStatus: isPublic.value ? 'PUBLIC' : 'PRIVATE',
    scheduleRepeatId: null,
    repeatOrder: null,
    meetingStatus: isMeeting.value ? 'ACTIVE' : 'INACTIVE',
    meetingRoomId: null,
    attendeeIds: [],
    notificationTime: null,
}));

// formData 확인용
watch(formData, () => {
    console.log('id', formData.value.id);
    console.log('title', formData.value.title);
    console.log('content', formData.value.content);
    console.log('startTime', formData.value.startTime);
    console.log('endTime', formData.value.endTime);
    console.log('publicStatus', formData.value.publicStatus);
    console.log('scheduleRepeatId', formData.value.scheduleRepeatId);
    console.log('repeatOrder', formData.value.repeatOrder);
    console.log('meetingStatus', formData.value.meetingStatus);
    console.log('meetingRoomId', formData.value.meetingRoomId);
    console.log('attendeeIds', formData.value.attendeeIds);
    console.log('notificationTime', formData.value.notificationTime);
});

// 10분 단위로 시간을 생성하는 함수
const generateTimeOptions = () => {
    const times = [];
    const labels = ['오전', '오후'];
    let hour = 0;

    for (let i = 0; i < 24; i++) {
        for (let j = 0; j < 60; j += 10) {
            const hour12 = hour % 12 || 12; // 12-hour format for AM/PM
            const ampm = hour < 12 ? labels[0] : labels[1];
            const minutes = j < 10 ? '0' + j : j;
            const label = `${ampm} ${hour12}:${minutes}`;
            const value = `${('0' + hour).slice(-2)}:${minutes}`;
            times.push({ label, value });
        }
        hour++;
    }

    return times;
};

// 시간 옵션 생성
const timeOptions = generateTimeOptions();

// startDate가 변경될 때 endDate를 자동으로 조정
const onStartDateChange = () => {
    if (endDate.value && endDate.value < startDate.value) {
        endDate.value = startDate.value;
    }
};

// endDateTime을 startDateTime 이후로 필터링
const filteredEndTimeOptions = computed(() => {
    if (startDate.value && endDate.value) {
        // endDate와 startDate가 같은 날일 때
        if (startDate.value.toDateString() === endDate.value.toDateString()) {
            const startIndex = timeOptions.findIndex((option) => option.value === startDateTime.value);
            // startDateTime 이후의 시간만 필터링
            const validOptions = timeOptions.slice(startIndex + 1);
            // 만약 endDateTime이 startDateTime 이전이라면, endDateTime을 startDateTime으로 자동 설정
            if (endDateTime.value && validOptions.findIndex((option) => option.value === endDateTime.value) < 0) {
                endDateTime.value = validOptions[0].value;
            }
            return validOptions;
        }
    }
    return timeOptions; // 다른 경우 기본 timeOptions
});

watch([startDate, endDate], () => {
    onStartDateChange();
});

// isMeeting이 true로 변경되면 isPublic도 true로 설정
watch(isMeeting, (newValue) => {
    if (newValue) {
        isPublic.value = true;
    }
});

const submitSchedule = async () => {
    try {
        // formData 변환
        const dataToSend = {
            user_id: formData.value.id,
            title: formData.value.title,
            content: formData.value.content,
            start_time: formData.value.startTime,
            end_time: formData.value.endTime,
            public_status: formData.value.publicStatus,
            schedule_repeat_id: formData.value.scheduleRepeatId,
            repeat_order: formData.value.repeatOrder,
            meeting_status: formData.value.meetingStatus,
            meetingroom_id: formData.value.meetingRoomId,
            // attendee_ids: formData.value.attendeeIds,
            attendee_ids: [1, 3, 5],
        };

        const schedule_id = props.schedule.scheduleId;
        let response;

        // 요청 보내기
        if (props.isEditMode) {
            // 첫 번째 요청: 기본 데이터 수정
            response = await axios.put(`/schedule/${schedule_id}`, dataToSend, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            // 두 번째 요청: notification_time 수정
            if (formData.value.notificationTime) {
                const notificationData = {
                    schedule_id: schedule_id,
                    notification_time: formData.value.notificationTime,
                    user_id: props.schedule.userId,
                };

                await axios.put(`/userschedule/notification`, notificationData, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
            }
        } else {
            // 등록 요청
            response = await axios.post(
                '/schedule',
                {
                    ...dataToSend,
                    notification_time: formData.value.notificationTime,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
        }

        if (response.status === 200) {
            // 성공적으로 데이터를 전송한 후
            console.log(props.isEditMode ? '스케줄 수정 성공' : '스케줄 등록 성공', response.data);

            // 모달을 닫거나 다른 작업 수행
            emit('submit');
            emit('close');
        } else {
            // 서버에서 에러 발생 시
            alert('일정을 저장하는 데 실패했습니다. 다시 시도해주세요.');
        }
    } catch (error) {
        console.error(
            props.isEditMode ? '스케줄 수정 실패' : '스케줄 등록 실패',
            error.response?.data || error.message
        );
        alert(props.isEditMode ? '스케줄 수정에 실패했습니다.' : '스케줄 등록에 실패했습니다. 다시 시도해주세요.');
    }
};

// 상태 변경을 formData에 반영
watch(
    isMeeting,
    (newValue) => {
        formData.value.meetingStatus = newValue ? 'ACTIVE' : 'INACTIVE';
    },
    { immediate: true }
);

watch(
    isPublic,
    (newValue) => {
        formData.value.publicStatus = newValue ? 'PUBLIC' : 'PRIVATE';
    },
    { immediate: true }
);

// 한국어 로케일 설정
const changeToKorean = () => {
    const primevue = usePrimeVue();
    primevue.config.locale = {
        firstDayOfWeek: 0,
        dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
        dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
        dayNamesMin: ['일', '월', '화', '수', '목', '금', '토'],
        monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
        monthNamesShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
        today: '오늘',
        clear: '초기화',
    };
};

/* 알람 관련!!! */
const showSelectAlarm = ref(props.isEditMode ? (props.schedule.notificationTime ? true : false) : false);

// 알람 시간 옵션 배열
const alarmOptions = [
    { label: '10분 전', value: '00:10' },
    { label: '20분 전', value: '00:20' },
    { label: '30분 전', value: '00:30' },
    { label: '40분 전', value: '00:40' },
    { label: '50분 전', value: '00:50' },
    { label: '1시간 전', value: '00:60' },
];

const notificationTime = ref(
    props.isEditMode
        ? (props.schedule.notificationTime ? 
        String(
              ((dayjs(props.schedule.startTime).diff(dayjs(props.schedule.notificationTime)) % 60000) / 1000 / 60) * 60
            ).padStart(2, '0') +
                ':' +
                String(
                    Math.floor(dayjs(props.schedule.startTime).diff(dayjs(props.schedule.notificationTime)) / 1000 / 60)
                ).padStart(2, '0') : '00:10')
        : '00:10'
);

watch(
    [notificationTime, startDateTime, showSelectAlarm],
    () => {
        if (isAllDay.value) {
            formData.value.notificationTime = null;
            console.log(`알람 시간 설정?: ${formData.value.notificationTime}`);
        } else if (showSelectAlarm.value) {
            // "HH:mm" 형식의 시간을 duration으로 변환
            const [hours, minutes] = notificationTime.value.split(':').map(Number);
            const notificationDuration = dayjs.duration({ hours, minutes }); // duration 객체 생성

            // 기존 시작 시간 계산
            const originalStartTime = dayjs(`${startDateRegist.value}T${startDateTimeRegist.value}`);
            const adjustedTime = originalStartTime.subtract(notificationDuration); // 알람 시간만큼 빼기

            formData.value.notificationTime = adjustedTime.format('YYYY-MM-DDTHH:mm:ss+09:00'); // ISO 형식으로 설정
            console.log(`알람 시간 설정!!: ${formData.value.notificationTime}`);
        }
    },
    { immediate: true }
);

onMounted(() => {
    changeToKorean(); // 한국어 설정 함수 호출
});
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

.close-btn {
    text-align: right;
    cursor: pointer;
}

.title {
    border-bottom: 0.1rem solid #cfcfcf;
    margin-left: 3.5rem;
}

.title-input {
    width: 100%;
    border: none;
    font-size: 2rem;
    padding: 1rem 0;
    margin-top: 1rem;
    color: #333;
}

.title-input::placeholder {
    color: #999;
}

.text {
    margin-left: 3.5rem;
}

.text .p-textarea {
    resize: none;
    width: 100%;
}

.toggle-section {
    margin-top: 1rem;
    margin-bottom: 1rem;
}

.toggle-label {
    display: flex;
    align-items: center;
}

.description {
    margin-left: 3.5rem;
    color: #999;
}

.indent {
    margin-left: 3.5rem;
}

.align-center {
    display: flex;
    align-items: center;
}

.p-textarea {
    width: 100%;
    height: 5rem;
}

.icon {
    width: 2rem;
    height: 2rem;
    margin-right: 1.5rem;
}

.pi {
    font-size: 2rem;
    margin-right: 1.5rem;
    vertical-align: middle;
}

.pi-times {
    font-size: 1.5rem;
    margin-right: 0;
}

.title-name {
    font-size: 1.2rem;
    margin-right: 1rem;
}

.button-section {
    display: flex;
    justify-content: flex-end; /* 오른쪽 정렬 */
    gap: 1rem; /* 버튼 사이에 간격 추가 */
}

::v-deep(.button-section .p-button) {
    width: 5rem;
    height: 3rem;
}

.dropdown-container {
    display: flex;
    align-items: center;
    gap: 1rem; /* 드롭다운과 닫기 버튼 사이 간격 */
    position: relative;
}

.dropdown-container .pi-times {
    font-size: 1rem;
    color: #999;
    cursor: pointer;
    opacity: 0; /* 기본적으로 숨김 */
    transition: opacity 0.3s;
}

.dropdown-container:hover .pi-times {
    opacity: 1; /* 마우스가 드롭다운 위에 있을 때 표시 */
    color: #333;
}

::v-deep(.p-select) {
    border: none;
    box-shadow: none;
}

::v-deep(.p-select-label) {
    padding: 0 !important;
    padding-left: 0.5rem !important;
}

::v-deep(.indent .p-select-label) {
    padding: 0 !important;
}

::v-deep(.indent .p-select) {
    background-color: #cdcdcd;
    padding-left: 1rem;
    padding-right: 1rem;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
}

::v-deep(.p-select-dropdown) {
    display: none;
}

::v-deep(.p-datepicker) {
    width: 7.2rem;
}

::v-deep(.p-inputtext) {
    border: none;
    box-shadow: none;
    padding: 0 !important;
}

.p-inputtext:hover {
    background-color: #999;
}
</style>
