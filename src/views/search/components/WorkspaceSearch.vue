<template>
  <div class="result-content" @click="$emit('click')">
    <div class="result-header">
      <i class="pi pi-share-alt" style="font-size: 16px; height: 20px;"></i>
      <h3>{{ result.workspaceName }}</h3>
    </div>
    <p class="result-date">생성일: {{ result.createdAt }}</p>
    <div class="result-meta-grid">
      <div v-if="result.projectName" class="meta-item">
        <span class="meta-label">프로젝트명:</span>
        <span class="meta-value">{{ result.projectName }}</span>
      </div>
      <div v-if="result.vcsType" class="meta-item">
        <span v-if="result.vcsType">
        VCS: 
        <span style="display: inline-flex; align-items: center;">
          {{ result.vcsType }}
          <i v-if="result.vcsType.toLowerCase() === 'github'" 
            class="pi pi-github" 
            style="margin-left: 4px; font-size: 16px; width: 16px; height: 16px;"></i>
          <img v-if="result.vcsType.toLowerCase() === 'gitlab'" 
              :src="GitlabIcon" 
              alt="Gitlab" 
              style="width: 16px; height: 16px; margin-left: 4px;">
        </span>
      </span>
      </div>
      <div v-if="result.vcsRepoName" class="meta-item">
        <span class="meta-label">VCS 레포지토리명:</span>
        <span class="meta-value">{{ result.vcsRepoName }}</span>
      </div>
      <div v-if="result.vcsRepoUrl" class="meta-item">
        <span class="meta-label">VCS URL:</span>
        <span class="meta-value">{{ result.vcsRepoUrl }}</span>
      </div>
    </div>
  </div>
</template>
  
  <script setup>
  import {defineProps, onMounted} from 'vue';
  import GitlabIcon from '@/assets/icons/Gitlab.svg';
  
  const props = defineProps({
    result: {
      type: Object,
      required: true
    }
  });
  
  onMounted(() => {
    console.log('컴포넌트 마운트 시 props 데이터:', props.result);
  });
  </script>
  

<style scoped>
.result-content {
  cursor: pointer;
  padding: 1rem;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.result-meta {
  display: flex;
  flex-wrap: wrap; /* 긴 내용을 여러 줄로 표시 */
  gap: 1rem;
  color: #666;
  font-size: 0.9rem;
  max-width: 100%; /* 컨테이너 너비를 넘지 않도록 */
}

.result-content:hover {
    background-color: #f5f5f5;
  }

/* URL이 긴 경우를 위한 스타일 추가 */
.result-meta span {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.result-header h3 {
  margin: 0;
  color: #1a73e8;
  font-size: x-large;
}

.meta-item {
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
}

.meta-label {
  color: #666;
  white-space: nowrap;
}

.meta-value {
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>