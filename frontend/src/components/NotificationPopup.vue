<template>
  <transition name="fade">
    <div class="notification" :class="type" v-if="visible">
      <div class="notification-content">
        <span class="notification-icon">{{ icon }}</span>
        <div class="notification-text">
          <strong>{{ title }}</strong>
          <p>{{ message }}</p>
        </div>
        <button class="notification-close" @click="close">×</button>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'NotificationPopup',
  props: {
    type: {
      type: String,
      default: 'success',
      validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
    },
    title: {
      type: String,
      default: ''
    },
    message: {
      type: String,
      default: ''
    },
    duration: {
      type: Number,
      default: 3000
    }
  },
  data() {
    return {
      visible: false,
      timeoutId: null
    }
  },
  computed: {
    icon() {
      const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
      }
      return icons[this.type] || '📢'
    }
  },
  mounted() {
    this.show()
  },
  methods: {
    show() {
      this.visible = true
      
      if (this.duration > 0) {
        this.timeoutId = setTimeout(() => {
          this.close()
        }, this.duration)
      }
    },
    
    close() {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId)
      }
      this.visible = false
      this.$emit('close')
    }
  }
}
</script>

<style scoped>
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  min-width: 300px;
  max-width: 400px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 5px 25px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  overflow: hidden;
}

.notification.success {
  border-left: 4px solid #4CAF50;
}

.notification.error {
  border-left: 4px solid #f44336;
}

.notification.warning {
  border-left: 4px solid #ff9800;
}

.notification.info {
  border-left: 4px solid #2196F3;
}

.notification-content {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  gap: 12px;
}

.notification-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.notification-text {
  flex: 1;
}

.notification-text strong {
  display: block;
  margin-bottom: 4px;
  font-size: 16px;
}

.notification-text p {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.notification-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notification-close:hover {
  color: #333;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(100px);
}
</style>