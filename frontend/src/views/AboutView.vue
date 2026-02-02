<template>
  <div class="about">
    <h1>🎬 О MediaJournal</h1>
    <p>Твой личный трекер фильмов, книг и сериалов с SQLite базой данных!</p>

  </div>
</template>

<script>
export default {
  name: "AboutView",
};
</script>

<style scoped>
.about {
  max-width: 800px;
  margin: 40px auto;
  padding: 20px;
}

h1 {
  color: #333;
  margin-bottom: 20px;
}

.features {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 10px;
  margin: 30px 0;
}

.features ul {
  list-style-type: none;
  padding-left: 0;
}

.features li {
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.features li:before {
  content: "✓ ";
  color: #4caf50;
  font-weight: bold;
}

.back-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 20px;
}

.back-btn:hover {
  background: #5a67d8;
}
</style>
