---
layout: default
title: Retro Games
permalink: /games/
---

<div class="games-corner">
  <header class="games-header">
    <h1>🎮 Retro Games</h1>
    <p>Here is my collection of retro Flash games.</p>
  </header>

  <div class="games-grid">
    {% assign flash_games = site.games | where: "game_type", "flash" %}
    
    {% if flash_games.size > 0 %}
      <section class="game-section">
        <h2>🌟 Flash Games</h2>
        <p class="section-description">Classic Flash games powered by Ruffle emulator</p>
        <div class="game-cards">
          {% for game in flash_games %}
            <a href="{{ game.url }}" class="game-card flash-game">
              <div class="game-thumbnail">
                {% if game.thumbnail %}
                  <img src="{{ game.thumbnail }}" alt="{{ game.title }}" loading="lazy">
                {% else %}
                  <div class="placeholder-thumbnail">
                    <span>🎮</span>
                  </div>
                {% endif %}
              </div>
              <div class="game-info">
                <h3>{{ game.title }}</h3>
                {% if game.description %}
                  <p class="game-description">{{ game.description | truncate: 100 }}</p>
                {% endif %}
              </div>
            </a>
          {% endfor %}
        </div>
      </section>
    {% endif %}
    
    {% if site.games.size == 0 %}
      <div class="no-games">
        <h2>🎮 Coming Soon!</h2>
        <p>Games are being added to the collection. Check back soon for awesome retro gaming experience!</p>
      </div>
    {% endif %}
  </div>

  <div class="gaming-info">
    <h2>🎯 How to Play</h2>
    <div class="info-grid">
      <div class="info-card">
        <h3>Flash Games</h3>
        <ul>
          <li>Click on any game card to start playing</li>
          <li>Most games use mouse and keyboard</li>
          <li>Some games may take a moment to load</li>
          <li>Powered by Ruffle emulator</li>
        </ul>
      </div>
    </div>
  </div>
</div>

<style>
.games-corner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.games-header {
  text-align: center;
  margin-bottom: 40px;
}

.games-header h1 {
  font-size: 3em;
  margin-bottom: 15px;
  color: #333;
}

.games-header p {
  font-size: 1.2em;
  color: #666;
  max-width: 600px;
  margin: 0 auto;
}

.game-section {
  margin-bottom: 50px;
}

.game-section h2 {
  font-size: 2.2em;
  margin-bottom: 10px;
  color: #333;
}

.section-description {
  color: #666;
  margin-bottom: 30px;
  font-size: 1.1em;
}

.game-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 25px;
  margin-bottom: 30px;
}

.game-card {
  background: white;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  text-decoration: none;
  color: inherit;
  display: block;
  cursor: pointer;
}

.game-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.game-thumbnail {
  position: relative;
  height: 200px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.game-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder-thumbnail {
  font-size: 4em;
  color: white;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.game-info {
  padding: 20px;
}

.game-info h3 {
  font-size: 1.4em;
  margin-bottom: 10px;
  color: #333;
}

.game-description {
  color: #666;
  line-height: 1.5;
  margin-bottom: 15px;
}

.game-meta {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.game-type {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8em;
  font-weight: bold;
  text-transform: uppercase;
}

.game-type.flash {
  background: #ff6b6b;
  color: white;
}

.file-size {
  color: #999;
  font-size: 0.9em;
}

.no-games {
  text-align: center;
  padding: 60px 20px;
  background: #f8f9fa;
  border-radius: 15px;
}

.no-games h2 {
  font-size: 2.5em;
  margin-bottom: 15px;
  color: #333;
}

.gaming-info {
  background: #f8f9fa;
  padding: 40px;
  border-radius: 15px;
  margin-top: 50px;
}

.gaming-info h2 {
  text-align: center;
  margin-bottom: 30px;
  font-size: 2.2em;
  color: #333;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}

.info-card {
  background: white;
  padding: 25px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.info-card h3 {
  font-size: 1.3em;
  margin-bottom: 15px;
  color: #333;
}

.info-card ul {
  list-style: none;
  padding: 0;
}

.info-card li {
  padding: 8px 0;
  border-bottom: 1px solid #eee;
  position: relative;
  padding-left: 25px;
}

.info-card li:before {
  content: "✓";
  position: absolute;
  left: 0;
  color: #4ecdc4;
  font-weight: bold;
}

.info-card li:last-child {
  border-bottom: none;
}

/* Responsive design */
@media (max-width: 768px) {
  .games-header h1 {
    font-size: 2.2em;
  }
  
  .game-cards {
    grid-template-columns: 1fr;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .gaming-info {
    padding: 20px;
  }
}
</style>
