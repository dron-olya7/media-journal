<template>
  <transition name="modal">
    <div class="confirmation-overlay" v-if="visible" @click.self="cancel">
      <div class="confirmation-modal">
        <div class="confirmation-header">
          <span class="confirmation-icon">{{ icon }}</span>
          <h3>{{ title }}</h3>
        </div>
        
        <div class="confirmation-body">
          <p>{{ message }}</p>
          
          <div class="confirmation-details" v-if="details">
            <p class="details-label">{{ details.label }}:</p>
            <p class="details-value">{{ details.value }}</p>
          </div>
        </div>
        
        <div class="confirmation-actions">
          <button class="btn-cancel" @click="cancel">
            {{ cancelText }}
          </button>
          <button class="btn-confirm" @click="confirm" :class="{ 'btn-danger': danger }">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'ConfirmationPopup',
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    title: {
      type: String,
      default: 'Подтверждение'
    },
    message: {
      type: String,
      required: true
    },
    details: {
      type: Object,
      default: null
    },
    icon: {
      type: String,
      default: '❓'
    },
    confirmText: {
      type: String,
      default: 'Да'
    },
    cancelText: {
      type: String,
      default: 'Нет'
    },
    danger: {
      type: Boolean,
      default: false
    }
  },
  emits: ['confirm', 'cancel'],
  methods: {
    confirm() {
      this.$emit('confirm')
    },
    cancel() {
      this.$emit('cancel')
    }
  }
}
</script>

<style scoped>
.confirmation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
}

.confirmation-modal {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.confirmation-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.confirmation-icon {
  font-size: 32px;
}

.confirmation-header h3 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.confirmation-body {
  margin-bottom: 24px;
}

.confirmation-body p {
  margin: 0 0 16px 0;
  line-height: 1.5;
  color: #555;
}

.confirmation-details {
  background: #f9f9f9;
  padding: 12px;
  border-radius: 8px;
  margin-top: 16px;
}

.details-label {
  font-weight: bold;
  margin-bottom: 4px !important;
  color: #333;
}

.details-value {
  margin: 0 !important;
  color: #666;
  font-style: italic;
}

.confirmation-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-cancel,
.btn-confirm {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  min-width: 80px;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-confirm {
  background: #4CAF50;
  color: white;
}

.btn-confirm:hover {
  background: #45a049;
}

.btn-danger {
  background: #f44336 !important;
}

.btn-danger:hover {
  background: #d32f2f !important;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>