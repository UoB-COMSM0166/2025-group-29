# 2025-group-29
2025 COMSM0166 group 29

| Name         | Email                 | GitHub Username |
|--------------|-----------------------|------------------|
| Weihao Zeng  | lh24059@bristol.ac.uk | Zengweihaooo     |
| Lepeng Zhou  | wn24588@bristol.ac.uk | Lepengz233       |
| Yichen Zhang | gd24475@bristol.ac.uk | Enderman928      |
| Guojie Liu   | jy24369@bristol.ac.uk | henlandl         |
| Mengqiu Yan  | zj24391@bristol.ac.uk | zj24391          |
| Chen Zhang   | ov24336@bristol.ac.uk | ov24336          |

![image](https://github.com/user-attachments/assets/9ebbb493-48c5-424e-82cb-62763bb76816)



#### **Kanban Board**  
- **HTML Version** ➡️ [View Here](https://zengweihaooo.github.io/JavaScriptGame/kanban/index.html)

#### **Drawing App**  
- **Try the App** ➡️ [Play Here](https://zengweihaooo.github.io/JavaScriptGame/games/week02_sketch/index.html)



## Your Game
[Download demo video](/docs/Demo/video.mp4)

Link to your game [PLAY HERE](https://uob-comsm0166.github.io/2025-group-29/)

Your game lives in the [/docs/Demo](/docs/Demo) folder(source code ,all development files and assets), and is published using Github pages to the link above.

Include a demo video of your game here (you don't have to wait until the end, you can insert a work in progress video)

## Your Group

Add a group photo here!

| Name         | Email                 | GitHub Username |
|--------------|-----------------------|------------------|
| Weihao Zeng  | lh24059@bristol.ac.uk | Zengweihaooo     |
| Lepeng Zhou  | wn24588@bristol.ac.uk | Lepengz233       |
| Yichen Zhang | gd24475@bristol.ac.uk | Enderman928      |
| Guojie Liu   | jy24369@bristol.ac.uk | henlandl         |
| Mengqiu Yan  | zj24391@bristol.ac.uk | zj24391          |
| Chen Zhang   | ov24336@bristol.ac.uk | ov24336          |

# Project Report
## Table of Contents
- [1 Introduction](#1-introduction)
- [2 Art Design and Innovation](#2-art-design-and-innovation)
  - [2.1 Character State](#21-character-state)
  - [2.2 Skill And Attack Effects](#22-skill-and-attack-effects)
  - [2.3 Monster And Time Item Appearances](#23-monster-and-time-item-appearances)
  - [2.4 Boss Skill Animation Showcase](#24-boss-skill-animation-showcase)
  - [2.5 Bullet Types](#25-bullet-types)
  - [2.6 Visual Effects](#26-visual-effects)
- [3 Requirements](#3-requirements)
  - [3.1 Ideation & Inspiration](#31-ideation--inspiration)
  - [3.2 Stakeholder Analysis](#32-stakeholder-analysis)
  - [3.3 User Stories](#33-user-stories)
- [4 Design](#4-design)
  - [4.1 Class Diagram](#41-class-diagram)
  - [4.2 Use Case Diagram](#42-use-case-diagram)
  - [4.3 Behavioral Diagram](#43-behavioral-diagram)
  - [4.4 System Architecture](#44-system-architecture)
- [5 Implementation](#5-implementation)
  - [5.1 Challenge 1: Skill Tree System and Animation Management](#51-challenge-1-skill-tree-system-and-animation-management)
  - [5.2 Challenge 2: Managing Concurrent Skill Effects](#52-Challenge-2-Managing-Concurrent-Skill-Effects)
  - [5.3 Challenge 3: Enemy Generation and Behavior Design](#53-Challenge-3-Enemy-Generation-and-Behavior-Design)
  - [5.4 Challenge 4: Save and Data System Design](#54-Challenge-4-Save-and-Data-System-Design)
- [6 Evaluation](#6-evaluation)
  - [6.1 Think-Aloud Testing](#61-qualitative-evaluation)
  - [6.2 NASA-TLX Workload Study](#62-quantitative-evaluation)
  - [6.3 Testing Methodology](#63-testing-methodology)
- [7 Sustainability, ethics and accessibility](#7-sustainability-ethics-and-accessibility)
  - [7.1 Environmental](#71-environmental)
  - [7.2 Technical](#72-technical)
  - [7.3 Individual](#73-individual)
- [8 Process](#8-process)
- [9 Conclusion](#9-conclusion)
- [10 Contribution Statement](#10-contribution-statement)
- [11 Additional Marks](#11-additional-marks)

# 1 Introduction
This document outlines our software engineering practices in developing a brand-new game from scratch.

Space Hunt is a side-scrolling combat game set in the forbidden depths of the universe, a realm where death and violence reign supreme. Players take on the role of a space hunter   burdened by a dark past, awakening from a long cryosleep to pursue the only mission he knows: the hunt—until all returns to nothingness.

The game features two difficulty levels. While the core gameplay mechanics remain consistent across both, the higher difficulty introduces faster-paced combat, more frequent and powerful enemy spawns, and fewer healing items.

![gif1](docs/Datas/1st.gif)

The game is structured around five meticulously designed levels, integrated with a robust skill progression system. Players can switch gear and skills between levels based on combat needs, facing off against a variety of mutated enemies such as tracking beasts, stealth monsters, and bullet-hell creatures. Within a limited time, players strive to earn higher scores and gradually evolve into the ultimate hunter. Space Hunt aims to deliver a fluid, exhilarating combat experience combined with a cyberpunk/cosmic horror aesthetic and a deeply immersive narrative, offering players a thrilling journey of cosmic hunting filled with both action and atmosphere.

![gif2](docs/Datas/2nd.gif)

The initial inspiration for this project came from classic .io games, especially Agar.io. We wanted to pay homage to these simple yet strategic experiences. Our early concept envisioned a survival game set in space, where players must navigate vast cosmic environments and outwit other entities to escape—a vision born from our shared passion for space horror themes.

However, as the project evolved, we realized that a pure survival mechanic wouldn't provide the pacing and long-term engagement we were aiming for. Coupled with our team’s enthusiasm for traditional RPG combat systems, we decided to shift the game’s tone—from fearful escape to intense combat—allowing the player not just to be prey in the dark cosmos, but a predator striking back.
[Back to Table of Contents](#table-of-contents)
# 2 Art Design and Innovation
We combine our art design with creative gameplay systems to improve player interaction and make the game more fun to play.

## 2.1 Character State
Character design is combined with the skill tree system. Players can freely choose skills to build skill tree branches and styles, which activate different states.

| Image                                                           | Name        | Description                                                                           |
|-----------------------------------------------------------------|-------------|---------------------------------------------------------------------------------------|
|![image](docs/Demo/assets/media/character/normal-idle-base.gif)  | Normal mode | The normal state of the battle mecha when no skill tree branch or style is activated. |
|![image](docs/Demo/assets/media/character/agile-idle-base.gif)   | Agile mode  | The state of the battle mecha when the agile-type skill tree branch is activated.     |
|![image](docs/Demo/assets/media/character/power-idle-base.gif)   | Power mode  | The state of the battle mecha when the power-type skill tree branch is activated.     |
|![image](docs/Demo/assets/media/character/tank-idle-base.gif)    | Tank mode   |  The state of the battle mecha when the tank-type skill tree branch is activated.     |

## 2.2 Skill And Attack Effects
Skill animations and effects are combined with art to make the game more immersive and fun for players.

| Image                                                             | Name           | Description                                                                                                                         |
|-------------------------------------------------------------------|----------------|-------------------------------------------------------------------------------------------------------------------------------------|
|![image](docs/Demo/assets/media/character/normal-attack-base.gif)  | Attack         | The animation of the character’s normal attack.                                                                                     |
|![image](docs/Demo/assets/media/character/normal-idle-boost.gif)   | Ghost Cutter   | An attack boost. Increases attack power for a short time.                                                                           |
|![image](docs/Demo/assets/media/character/normal-idle-shield.gif)  | Iron Reversal  | A shield skill. Creates a shield that blocks damage and can reflect bullet attacks.                                                 |
|![image](docs/Demo/assets/media/character/normal-idle-steal.gif)   | Crimson Drain  | A lifesteal skill. Attacks restore some health.                                                                                     | 
|![image](docs/Demo/assets/media/character/normal-idle-dash.gif)    | Phantom Dash   | A dash skill. The character dashes forward and deals area damage along the path.                                                    |
|![image](docs/Demo/assets/media/character/normal-attack-charge.gif)| Wrath Unchained| A charge-up skill. After charging, it deals heavy damage to enemies in a 360-degree area and reduces damage taken while charging.   |
|![image](docs/Demo/assets/media/icon/icon1.PNG)                    | Anchor Field     | Summons a slow-down field in a 360-degree area. Enemies that come close will be slowed down.                                        |
|![image](docs/Demo/assets/media/icon/icon4.PNG)                    | Runner’s Instinct| Passive skill after activating the agility skill tree style: if you kill an enemy, your Phantom Dash skill will be refreshed.       |
|![image](docs/Demo/assets/media/icon/icon6.PNG)                    | Guardian’s Will  | Passive skill after activating the tank skill tree style: enemies take damage while inside the Anchor Field skill, and the damage dealt will be added to the value of the next Iron Reversal skill.   |
|![image](docs/Demo/assets/media/icon/icon9.png)                    | Berserker’s Blood| Passive skill after activating the power skill tree style: when the player's health is below a certain percentage, their attack power is greatly increased.  |

## 2.3 Monster And Time Item Appearances
Carefully designed monster appearances match the game’s theme and make players feel more involved.

| Image                                                               | Name             | Description                                                                                                                         |
|---------------------------------------------------------------------|------------------|-------------------------------------------------------------------------------------------------------------------------------------|
|![image](docs/Demo/assets/media/monster/normal-monster.gif)          | Normal-monster   | Moves around within a set area.                                                                                                     |
|![image](docs/Demo/assets/media/monster/Follow-monster.gif)          | Follow-monster   | Follows and attacks the player.                                                                                                     |
|![image](docs/Demo/assets/media/monster/Invisible-monster.gif)       | Invisible-monster| Becomes visible only when the player gets close, then follows and attacks.                                                          |
|![image](docs/Demo/assets/media/monster/Ambush-monster-attack.gif)   | Ambush-monster   | Rushes to attack the player quickly when close.                                                                                     | 
|![image](docs/Demo/assets/media/monster/Danmaku-monster.gif)         | Danmaku-monster  | Shoots bullet attacks at the player.                                                                                                |
|![image](docs/Demo/assets/media/boss/TOWER.gif)                      | Tower            | A device summoned by the boss.                                                                                                      |
|![image](docs/Demo/assets/media/boss/BOSS_IDLE.gif)                  | Boss             | Has many attack moves and effects, and includes game mechanics that players need to figure out.                                     |
|![image](docs/Demo/assets/media/time/time.gif)                       | Time             | Players can touch it to get extra time and earn more points.                                                                        |

## 2.4 Boss Skill Animation Showcase.
The boss has carefully designed skill animations and challenge mechanics. These increase the game’s difficulty and require players to use their chosen skill tree skills wisely in battle, making the game more exciting and fun.

| Image                                                               |  Description                                                                                                                         |
|---------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------|
|![image](docs/Demo/assets/media/boss/BOSS_BLACKHOLE_SKILL.gif)       |    The boss summons a black hole to limit the player’s movement area.              |
|![image](docs/Demo/assets/media/boss/BOSS_DASH.gif)                  |    The boss dashes forward to attack the player, leaving a trail that deals damage.                                                  |
|![image](docs/Demo/assets/media/boss/BOSS_SUMMON.gif)                |    The boss summons ambush enemies that chase and attack the player.                                                        |
|![image](docs/Demo/assets/media/boss/BOSS_TOWER_SKILL.gif)           |    The boss summons bullet attacks, and the player must dodge them while completing certain mechanics, or they will be punished.       | 
|![image](docs/Demo/assets/media/boss/BOSS_WAVE_BOSS.gif)             |    The boss summons area explosions in a random order. The player must use memory and quick reactions to dodge them.                  |



## 2.5 Bullet Types
Many kinds of bullets with different targets. This makes the visuals more interesting and improves the game experience.

| Image                                                               | Name                      | Description                                                                                                                         |
|---------------------------------------------------------------------|---------------------------|-------------------------------------------------------------------------------------------------------------------------------------|
|![image](docs/Demo/assets/media/bullet/Monster-bullet.gif)           | Monster-bullet            | Bullets shot by Danmaku-monsters.                                                                                                   |
|![image](docs/Demo/assets/media/bullet/Character-rebound-bullet.gif) | Character-rebound-bullet  | Bullets reflected by player skills.                                                                                                 |
|![image](docs/Demo/assets/media/bullet/Boss-bullet.gif)              | Boss-bullet               | Special bullet patterns from the boss.                                                                                              |

## 2.6 Visual Effects
Rich visual effects make the game more fun and improve the player’s experience.

| Image                                                               | Description              | Image                                                                 |        Description                                                   |
|---------------------------------------------------------------------|--------------------------|-----------------------------------------------------------------------|----------------------------------------------------------------------|
|![image](docs/Demo/assets/media/Visualeffect/boost.gif)              | character-boost          | ![image](docs/Demo/assets/media/Visualeffect/charge.gif)              |             character-charge                                         |
|![image](docs/Demo/assets/media/Visualeffect/shield.gif)             | character-shield         | ![image](docs/Demo/assets/media/Visualeffect/steal.gif)               |             character-steal                                          |
|![image](docs/Demo/assets/media/Visualeffect/character-dash-puff.gif)| character-dash-puff      | ![image](docs/Demo/assets/media/Visualeffect/character-idle-puff.gif) |             character-idle-puff                                      |
|![image](docs/Demo/assets/media/Visualeffect/boss-dash-explore.gif)  | boss-dash-explore        | ![image](docs/Demo/assets/media/Visualeffect/boss-blackhole.gif)      |             boss-blackhole                                           |
|![image](docs/Demo/assets/media/Visualeffect/boss-puff.gif)          | boss-puff                | ![image](docs/Demo/assets/media/Visualeffect/boss-summon.gif)         |             boss-summon                                              | 
|![image](docs/Demo/assets/media/Visualeffect/boss-wave.gif)          | boss-wave                | 


[Back to Table of Contents](#table-of-contents)


# 3 Requirements 
## 3.1 Ideation & Inspiration
Early on, our team brainstormed different types of games and talked about how we might adapt certain ideas. Our shared experience with games gave us a great starting point to create something of our own, and the flexibility to shift gears when our vision started to change. To make the combat feel both exciting and strategic, we took inspiration from the core mechanics and art styles of some of our favorite classic games and movies.
### Inspiration Overview

| Source Work                       | Key Elements Adopted                                      | Application in *Space Hunt*                                         |
|----------------------------------|------------------------------------------------------------|----------------------------------------------------------------------|
| **Agar.io**                      | Entity collision and devouring mechanics, minimalism       | Early prototype concept and core survival confrontation loop        |
| **Touhou Project**               | Dense bullet patterns, varied trajectories and styles      | Enemy projectile (barrage) design                                   |
| **Overwatch**                    | Hero skill system, cooldown-based abilities                | Player skill system and swap mechanics                              |
| **Hades**                        | Fast-paced combat, combo chaining                          | Responsive combat feel and skill impact                             |
| **Dead Cells**                   | Satisfying movement and combat rhythm                      | Smooth mobility and attack pacing                                   |
| **Pacific Rim (film)**           | Giant mech aesthetics, alien combat, apocalyptic tone      | Visual setting, cyborg-human style, alien monster design            |
| **Warframe**                     | Fluid melee combat, sci-fi art style                       | Art style reference and modular combat system                       |
| **Resident Evil(Mercenaries Mode)** | Countdown mechanics, score-based gameplay, checkpoint saves | Combat-time-score loop, level scoring and saving system             |


## 3.2 Stakeholder Analysis
We used the Onion Model to identify and discuss the different groups involved in building, using, and evaluating our game:
- **Core Layer – Developers:**
    
    As the development team, we were at the heart of the process, handling everything from design and coding to testing the game.
    
- **Inner Layer – Markers/Lecturers:**
    
    Acting like clients, they guided our development process and were in charge of evaluating the quality of the final product.
    
- **Middle Layer – Players:**
    
    These are the users who tested the game during development and gave us helpful feedback on gameplay, functionality, and user experience.
    
- **Outer Layer – Customers:**
    
    If the game were ever made available outside the university, these would be our general audience or potential buyers.
    
- **Outer Layer – University as a Negative Stakeholder:**
    
    In some cases, the university itself might be indirectly affected—for example, if the game caused distractions or impacted the school’s reputation, it would be seen as a negative stakeholder.

## 3.3 User Stories

- **As a player**
    
    > “I want the game to have a skill tree system so that I can choose and upgrade skills according to my playstyle and enhance my character's abilities. “
    > 
    
    > “I want the game to have a complete storyline so that I can immerse myself in the game world and enjoy a rich narrative experience. “
    > 
    
    > “I want the game to have a skin system so that I can customize the appearance of my character or equipment for a more personalized experience. “
    > 
    
    > “I want the game to have multiple playable characters, each with unique traits, so that I can choose the one that best fits my playstyle.  “
    > 
- **As a developer**
    
    > “I want players to enjoy our game.”
    > 
    
    > “I want to gain development skills.”
    > 
    
    > “I want to plan my time well and participate in quality teamworking.”
    > 
    
    > “I want to be a positive role model for the next cohort. “
    > 
    
    > “I want players to participate in early access testing for each version so that we can gather feedback and improve game balance patches.”
    > 
- **As a marker for this project,**
    
    > “I want to experience all core game mechanics in the shortest possible time.”
    > 
    
    > “I want to see a game that has something new and innovative, not just a simple copy of an existing game.”
    > 
    
    > “ I want to immerse myself in the game as quickly as possible after entering the main interface. “
    >
[Back to Table of Contents](#table-of-contents)
# 4 Design
---
## 4.1 Class Diagram

At the early stage of game development, class diagrams can help us grasp the structure of the game and clarify the core classes, modules and their corresponding responsibilities. This helps us to plan a good Object Oriented Design (OOD) in the original code, for example, to reasonably split the functions and reduce the cost of repeated communication between developers. The GitHub+VS Code integrated development methodology we adopted allows us to delineate feature branches (e.g. feature/player, feature/BlackHole) accordingly. Team members can review class implementations based on class diagrams, making simultaneous development of different modules by multiple people manageable.

Game Structure

- LevelManager: level controller. Manages the implementation of BaseLevel and its subclasses (e.g. Level1, Level2...) for each level. Each Level may contain enemy generation logic, black hole generation logic and so on.
- Player: Player entity, contains position, movement, life value, skill references, etc... Manages/uses the skill system, detects interaction with enemies/timecolumns/bullets.
- Enemy: Controls enemy behaviour logic. Manages subclasses of different types of enemies such as AmbushEnemy, StealthEnemy, BulletEnemy, Boss, etc.
- SkillSystem: Controls all skill activations, cooldowns, HUD displays, and more. Manages different skill subclasses, such as Dash skill, Blood fury skill, and so on.
- loadSaveData: Controls the archive system, used to read archives from Supabase and load them into the game environment.
- Other key classes: CollisionManager (detects player collisions with enemies, black holes, bullets, etc.) Bullet (manages all flying bullets for enemies and bosses to share) MeleeAttack class (manages interactions between enemies and players)

To see the details please save the following image! 

### Class Diagram
![Class Diagram](docs/Datas/Class%20Diagram.png)

---
## 4.2 Use Case Diagram

Although all key functionalities are already represented in the class diagram, we have also created a Use Case Diagram to more clearly illustrate the interactions between the player and various system modules. This diagram helps visualize the behavior paths from the player's perspective that are not easily inferred from the class diagram, such as the sequential relationships between different types of skills (active and passive).

The diagram shows how the player uses the InputHandler to control movement, interacts with the SkillSystem to activate skills, and engages with the LevelManager to enter levels or challenge bosses, providing a comprehensive view of how these systems work together.

### Use Case Diagram
![Case Diagram](docs/Datas/Case%20Diagram.png)


---
## 4.3 Behavioral Diagram

The class diagram tells us what exists in the system, the use case diagram describes what the player can do, and the sequence diagram illustrates how the system carries out these actions step by step. By creating a sequence diagram, we simulate the actual gameplay process—from game launch, level progression, and boss battles to level completion and game end.

### Sequence Diagram
![Sequence Diagram](docs/Datas/Sequence%20Diagram.png)

In the Game Launch phase, the current level (e.g. Level1) is loaded, player attributes are initialised (position, skill slots, HP, etc.), the skill system is initialised, shortcuts are bound, skills are registered, and enemies are generated for the first level.  

Then we enter the main game loop, InputHandler is responsible for detecting player's keystrokes (move, attack, release skills),
each module executes update() method in turn. Player class moves, attacks and calls skills. SkillSystem is responsible for skill cooldowns, sustained effects, skill state refresh. Enemy is responsible for enemy behavior. CollisionManager detects all the collision events and passes the result to HPSystem to execute the logic of deducting HP, restoring HP, shield adding, etc. This phase is a continuous loop until the level completion condition is triggered (e.g. defeating all enemies or reaching the scoring goal).

When the player passes the current level, LevelManager loads the next level (Level 2 to Level 5), regenerates the enemies and black holes. SkillSystem retains the player's skills and updates the passive/cooldown status.

In Level 5, the player will enter a specially designed Boss Battle, where the Boss will unleash a special skill and the player will need to fight against it with the help of the skills equipped in the previous levels. If the boss is defeated, the final checkout page will be displayed and the game will end successfully!

At the end of each level,  the player enters the shop screen, which displays upgrade options, rewards, recovery items, etc. The player can choose to upgrade their skills or exit the game.

---
## 4.4 System Architecture

![System Architecture](docs/Datas/System%20Architecture.png)

This System Architecture Diagram acts as a high-level component map that lays out the overall structure of the game. It works alongside other UML diagrams to provide a well-rounded development guide that covers the system’s structure, functionality, and behavior.

[Back to Table of Contents](#table-of-contents)

# 5 Implementation

We encountered a wide range of issues during development, which can be broadly categorized into two major domains: core gameplay logic and persistent data management.
Within the gameplay logic domain, the challenges further divide into two key subsystems: skill system architecture and logic and enemy generation & behavior modeling. Each subsystem posed distinct technical hurdles but collectively contributed to a cohesive and dynamic gameplay experience.


## 5.1 Challenge 1: Skill Tree System and Animation Management
The goal of our skill tree design is to provide players with more personalized growth paths and strategic options, thereby enhancing the game’s depth and replayability. Initially, we introduced three skill slots, and through skill combinations, players can experience a faction-based active skill system, encouraging them to build unique playstyles.
Later in development, to further differentiate these factions, we converted faction bonuses into three new passive skills that enhance corresponding active skills, reinforcing each faction's unique style and increasing immersion. At the same time, we retained the “three-color skill combination” mechanic, which means players can select one skill from each of the three factions, allowing for non-faction-based builds and greatly expanding the possibilities for creative experimentation.

![gif3](docs/Datas/3rd.gif)

For character sprite management, we adopted a three-level nested object structure called GIF_POOL to index GIF animations based on faction, status, and skill state. The function applyFactionFromSkills() dynamically determines the current faction based on the equipped skills and triggers a corresponding visual update to reflect the faction’s aesthetic.
To correctly display skill state animations, we implemented an Overlay Queue system. This queue uses push() to add animation requests, then uses sort() (based on timestamp and priority) to select the most appropriate animation to play, and filter() to remove expired overlays. This mechanism ensures that character animations always accurately reflect the player's current state.
________________________________________
## 5.2 Challenge 2: Managing Concurrent Skill Effects
Managing multiple overlapping skill effects was a difficult challenge. In our system, different skill effects have explicit priority levels. For example, Phantom Dash grants the highest-priority invincibility state—as long as the player is dashing, they become completely immune to damage. Under this condition, other skills such as Iron Reversal should not process any damage events to avoid situations where a dash through enemies causes the shield to break instantly.
To implement this, we centralized damage handling in the Player class and used a method isCurrentlyInvincible() that encapsulates multiple invincibility states. Inside the receiveDamage() function, we carefully ordered the logic to respect priority levels, ensuring that high-priority invincibility always takes precedence.
Additionally, we made sure that different skill effects can stack appropriately. Our skill system is designed to support a wide variety of combinations, encouraging players to experiment. The three-slot skill system is not isolated—players can explore different playstyles between skills. For example, within the Power faction, players can intentionally reduce their own HP to activate the passive Berserker’s Blood, enter a frenzied combat mode, and then recover HP quickly by combining lifesteal and charge attacks. These layered mechanics enable players to discover exciting and emergent playstyles.
________________________________________
## 5.3 Challenge 3: Enemy Generation and Behavior Design
Designing enemy generation and behavior was another challenging aspect. We implemented several movement behaviors: basic follow movement, dashing, stealth tracking, and direct aggression after revealing.
Enemy generation falls into two categories:
•	Static Generation: Used for BulletEnemy, FollowEnemy, and CommonEnemy. These enemies are generated once at level load, using randomized spawn positions constrained to valid areas (e.g., outside player’s vision).
•	Dynamic Generation: Used for StealthEnemy and AmbushEnemy. These are generated incrementally during the level’s update() loop, controlled by internal cooldowns and counters.
Each special enemy type has its unique behavior:
•	StealthEnemy exhibits unpredictable behavior, disappearing and relocating around player after stealthing.
•	AmbushEnemy uses the player’s current position and predicted movement path to spawn in forward-facing zones, simulating a real ambush scenario.
This combination of static and dynamic spawning, combined with behavioral variety, contributes to a more dynamic and engaging combat experience.
________________________________________
## 5.4 Challenge 4: Save and Data System Design
Because GitHub Pages can persist data only inside a single browser, progress disappears once the cache is cleared or the player switches devices. We therefore moved the save layer to Supabase, a hosted Postgres service that we access through simple REST APIs. A dedicated saves table stores each run; SQL views aggregate scores for leader boards. Cloud storage gives us cross-device continuity, centralised statistics and off-site backups—capabilities that client-side storage cannot match. The migration was not instantaneous: it required designing the schema, writing policy SQL, learning the JavaScript client, and handling latency, yet the result is robust and re-uses the relational theory we studied in Software Tools.


[Back to Table of Contents](#table-of-contents)

# 6 Evaluation

- **One qualitative evaluation:** Think-Aloud testing  
- **One quantitative evaluation:** NASA-TLX workload analysis  
- **Description of how code was tested**

## 6.1 Qualitative Evaluation

### Think-Aloud Testing: Iterative Feedback and In-Game Adjustments  

We conducted a Think-Aloud usability test with six participants (**N = 6**) who played through the first two levels while narrating their thoughts aloud. Verbal expressions were transcribed, tagged, and analyzed to extract user needs and usability pain-points. Based on repeated themes—**confusion**, **uncertainty**, **overwhelm**, and **cognitive load**—we derived a set of actionable design responses to improve player experience.

### Key Observations and Design Responses  

| **User Observation** | **Design Response** |
|----------------------|---------------------|
| “Why isn’t this button responding? Did I press the wrong thing?” | Added a skill-cooldown indicator in the bottom-left corner. |
| “Should I keep fighting or keep running?” | Moved the player’s health bar to the top for easier risk evaluation. |
| “I’m not quite sure what the goal is—is it to survive longer or to kill more?” | Added a score display and real-time feedback to clarify objectives. |
| “So that’s how this skill works—I didn’t realize it before.” | Enabled tooltip-on-hover in the skill shop. |
| “This is so intense—I feel like danger is coming from every direction.” | Ensured a minimum safe radius around the player’s spawn point. |
| “I think I’m gradually getting the hang of the game’s rhythm.” | No changes needed—pacing is working as intended. |
| “The pace suddenly picked up in this level—I’m kind of panicking.” | Re-balanced enemy spawn frequency and added a mid-level checkpoint. |
| “It’s starting to feel a bit repetitive—just run, fight, run.” | Introduced non-combat segments and new mechanics in Level&nbsp;3. |

![Word Cloud](docs/Datas/WordCloud.png)

### Insights & Impact  

These real-time voice comments exposed pain-points in **navigation, clarity, pacing,** and **player motivation**. Iterative adjustments based on these observations significantly improved onboarding and early-game engagement.

---

## 6.2 Quantitative Evaluation

### NASA-TLX Workload Analysis  

Simply comparing two difficulty levels might not be that exciting. Long-lasting games often maintain a well-tuned balance between different characters or playstyles. This balance helps prevent any one style from feeling disproportionately demanding and avoids the dreaded “class fatigue” that arises when an option feels like too much work.

To evaluate the subjective workload associated with different playstyles, we recruited eight participants to experience all three gameplay archetypes. To mitigate potential order effects—which we noticed during our first round of testing—we adopted a Latin-Square design that systematically varied the sequence in which each participant played the archetypes. This within-subjects setup ensures that each playstyle appears equally often in each position, helping us make fairer comparisons.(YES! We are such good students who learn new methods on our own)

### Workload Trend  

[View raw NASA-TLX data (CSV)](docs/Datas/NASA-TLX_Results.csv)  

![NASA-TLX Workload Trend (SVG)](docs/Datas/nasa_tlx_workload_SVG.svg)  
![NASA-TLX Workload Trend (JPG)](docs/Datas/nasa_tlx_workload.jpg)

Upon receiving the collected NASA-TLX data, we used Python and Matplotlib to visualize the average workload scores across the six TLX dimensions for each playstyle (Build&nbsp;A, B, C). The resulting line chart revealed distinct trends:

1. **Build&nbsp;A (Blue):** Moderate-to-low scores with a flat progression; slight drops in *Temporal Demand* and *Effort* indicate lighter pacing and cognitive investment.  
2. **Build&nbsp;B (Yellow):** Consistently highest in almost all dimensions, especially *Effort* and *Frustration*; the most demanding playstyle, likely to cause fatigue in later stages.  
3. **Build&nbsp;C (Pink):** Starts low, then gradually increases toward *Performance*; a “light-to-heavy” curve—easy to start, but more demanding over time.

The workload assessment revealed that Builds&nbsp;A and C remained within an acceptable range, providing variety without triggering frustration or overload. In contrast, Build&nbsp;B was identified as a workload outlier in need of tuning.

We iterated on Build&nbsp;B’s rebound mechanic—enhancing its in-game effects, feedback clarity, and skill-tree support—to reduce unnecessary mental overhead and smooth difficulty spikes. A final balance test confirmed that all builds now score below the 68-point NASA-TLX threshold.

![NASA-TLX Post-Balancing Trend (SVG)](docs/Datas/nasa_tlx_post_balancing.svg)  
**Cool! Scores below 68 and great balance!**

---

## 6.3 Testing Methodology  

We followed a **black-box, feature-oriented** strategy. Each core module—Skill System, Enemy AI, Save/Load API, and Level Timer—was treated as an independent unit. For every unit we listed its outward-facing features, then wrote concise test cases that stress **boundary conditions** (e.g., last frame of invincibility, timer hitting 0 s, max concurrent bullets, empty Supabase response).  

This uncovered edge bugs such as:  

* the player clipping into the boss gate at exactly `x = 0`,  
* bullet hit-boxes shrinking to zero when speed > 14 px / frame,  
* save files failing when a UID string reached 36 chars.  

After adjusting collision radii, bullet speed caps, and database field lengths, all cases passed a second run of the same black-box suite, giving us confidence in gameplay stability across levels and devices.  

[Back to Table of Contents](#table-of-contents)

---
# 7 Sustainability, ethics and accessibility

From the very start of our game project, we made a conscious effort to think about sustainability in the way we designed and built things. Inspired by the Karlskrona Manifesto—which talks about how design can change the world—we tried to keep in mind that software developers aren’t just responsible for making things work, but also for thinking about the broader impact of their tech. That includes potential side effects like increased energy use from over-optimization or systems that unintentionally waste resources. For example, we avoided constantly calling cloud services and instead added low-power loops and partial screen refreshes to reduce the computing load.

We also used the Sustainability Awareness Framework (SusAF) to guide us, focusing on three main areas: environmental impact, technical sustainability, and user well-being. Early on, we asked questions like: Will this design use unnecessary energy? Is it easy to understand and use? Will it work well for all types of players? These helped shape our development choices in a more responsible and thoughtful way.

## 7.1 Environmental
Even though software doesn’t use raw materials like hardware does, it still leaves a footprint through the electricity used when it runs or stores and sends data. So we tried to keep that in check:

- **Modular design**: We built the game with separate parts—like Player, SkillSystem, and BlackHole — so it’s easier to maintain and upgrade later, instead of throwing things away and starting over when they break.
- **Efficient saving**: We used Supabase to save game data, but kept things light. We only read from the cloud once at the start, and only write when the player finishes a level or saves manually. We also stored just the essentials—things like save ID, level, score, and a list of skill IDs—instead of large, bloated data structures.
- **Small assets**: We went with low-res pixel art and compressed our assets to make the game load faster and use less data.

All of this helps lower the game’s environmental impact and supports global sustainability goals like responsible tech use and climate action.

## 7.2 Technical
We wanted the code to stay usable and flexible even as the project grows or changes over time. So we focused on:

- **Clean architecture**: Core systems like LevelManager, Enemy, and SaveSystem all do one job and don’t overlap too much. That makes testing and updating way easier.
- **Branch-based workflow**: Every new feature—like the boss or black hole—was built and tested in its own GitHub branch. This made it easier to track changes, review code, and fix bugs without breaking other parts of the game.

These practices help prevent messy or outdated code, and make it easier for others (or even us in the future) to keep working on the game.

## 7.3 Individual
We paid attention to how our design might impact players emotionally and cognitively. Here’s what we did:

- **Gentle learning curve**: The early levels are simple and include helpful hints so that younger or less experienced players can ease into the game without frustration.
- **Easy restart**: If you die, you can restart instantly—and skip the tutorial if you’ve already seen it. This gives players more control over how they experience the game.

These choices show our commitment to accessibility, and long-term enjoyment, and reflect the kind of responsibility we believe game developers should take seriously.

[Back to Table of Contents](#table-of-contents)

---
# 8 Process 


Throughout the development of our real-time combat survival game, our team collaborated efficiently by embracing an Agile-inspired methodology. From the outset, we prioritized flexibility and iterative progress. To manage tasks effectively, we created a digital Kanban board with four clear columns: “Not Start,” “In Progress,” “Parked,” and “Done.” This visual approach allowed us to track precisely which tasks had yet to begin, which were actively being worked on, which tasks had temporarily stalled, and which were completed. The Kanban structure helped us break the development into manageable segments, clearly linking short-term tasks with broader project milestones.

Regular updates to the board occurred via our WeChat group. Team members either posted screenshots or directly updated task statuses, ensuring real-time alignment across the team. Additionally, we captured key board snapshots periodically to include in our final report for retrospective analysis.

For version control, we primarily used GitHub. Initially, we committed directly to the main branch, which quickly created issues such as merge conflicts and inconsistencies between versions. Realizing these challenges, we shifted to a trunk-based development model. Each team member managed their own feature branch, pulling and rebasing from the main branch upon completing a task, resolving conflicts locally, and then submitting a pull request. This approach significantly reduced integration issues, resulting in a stable and consistent codebase. Pull request discussions became essential for bug tracking, addressing architectural concerns, and documenting critical design decisions.

Although we did not formally assign team roles, responsibilities naturally emerged during the project's progression. One member specialized in developing the skill system and cooldown mechanics, while another concentrated on enemy AI and visual effects like trailing shadows and particle animations. This self-organized division of labor enabled us to remain agile and quickly adapt when obstacles arose. For particularly challenging tasks, such as the dash-reflect mechanics or timed skill triggers, we frequently employed pair programming. This practice improved debugging efficiency and encouraged knowledge sharing across the team.

Throughout the project, WeChat served as our primary communication tool. It provided rapid feedback and troubleshooting capabilities, enabling immediate responses to bugs or implementation questions. For broader design discussions—such as managing player death states or score displays—we held brief face-to-face meetings after our weekly Software Engineering lab sessions. These in-person interactions were particularly helpful for clarifying directions and reallocating tasks. During the reading week, we organized two dedicated UI design meetings to finalize front-end layouts and HUD placements. These sessions established a cohesive visual style early on, significantly reducing later adjustments.

As the semester progressed and workloads from other modules increased, we adapted our workflow to maintain productivity. Although we deliberately avoided assigning report writing or video editing tasks during the Easter break, we strategically utilized the pre-exam period for these deliverables. This timing enabled us to integrate key course concepts—such as usability heuristics and modular architecture principles—into our final report and reflections, enhancing both academic and practical quality.

A key strength of our team was our open and supportive communication culture. We comfortably provided direct feedback, whether on UI clarity or balancing game mechanics, and regularly revised gameplay elements based on test feedback. However, we identified one notable shortcoming: our reliance on WeChat sometimes caused our Kanban board to lag behind actual progress. To address this issue in future projects, we plan to assign a rotating “Kanban manager” role to maintain accurate and up-to-date task tracking.

Ultimately, this project provided valuable, hands-on experience with Agile principles, collaborative workflows, and team-based problem-solving. By effectively utilizing tools such as Kanban boards, Git branch workflows, code reviews, and flexible scheduling, we delivered a polished, feature-complete game on time. Most importantly, the lessons learned in teamwork, transparency, and iterative design will undoubtedly benefit us in future academic and professional endeavors.

![image](https://github.com/user-attachments/assets/2e1dd967-2b86-4867-b88f-5fa2026f46b4)

[Back to Table of Contents](#table-of-contents)
# 9 Conclusion

Looking back on the entire project, what we implemented in this game, we learnt how team members can collaborate with each other to achieve a game's output, and we also learnt solid system design through the game's design process. From the early stages of the project, we set a clear goal: to create a modular, extensible framework that could support multiple levels with different mechanics - sneak, ambush, pop-ups, boss battles, etc. - while at the same time sharing features such as player movement collision detection, skill management and remote archiving. To realise this vision, we recognised the importance of pre-planning the architectural design. We defined clear abstract classes, such as BaseLevel, Enemy, Skill, CollisionManager, etc., so that new features could be integrated smoothly and with less coupling. Through the design of SpriteManager and Skill Stacking Queue, we learned to decouple the rendering logic from the game logic, resulting in smoother character animations. The remote archiving feature uses Supabase to further understand the details of asynchronous data loading, such as how to ensure that the main game loop is not started until loadSaveData() completes, and how to provide friendly error feedback in the event of network exceptions.

Throughout the development process, we faced a number of challenges that became valuable learning opportunities. In order to balance performance and visual effects in a browser-based canvas environment, we analysed and optimised the performance of the code's hotspot paths, especially the particle effects in PixelExplosion and the per-frame halo drawing in the SlowField skill. Implementing complex boss behaviours (e.g. multi-stage ring barrage, tower deployment, dash explosion attack, black hole attraction mechanic), we realised how crucial it is to build a stable state machine with a precise timing control system. When debugging collision detection between a high-speed moving sprint trajectory and an out-of-field enemy generation point, we gained a deeper grasp of the logical handling of spatial demarcation strategies independent of frame rate. In addition, managing complex interactions between skills (e.g., controlling the timing of LifestealSkill triggers or accumulating Guardian's Will shields) also taught us that the integrity of unit testing and clear logic of the cooldown mechanism are key to ensuring the stability of the system.

During the course of the project, we also gained a lot of soft skills. For example, the use of bilingual (English comment structure, Chinese documented context) to write clear code comments improved the efficiency of collaboration; unified naming conventions and ES6 modular import mechanism enhanced maintainability; regular review and refactoring of shared logic effectively prevented the emergence of ‘spaghetti code’. We've also come to accept that iteration is progress: early prototypes were fragile, but as we continued to optimise, the code base became solid and reliable, providing a solid foundation for expanding functionality.

Looking ahead, the project still has a lot of room for improvement and expansion in basic aspects. For example, more rich designs can be made on the types of enemies and their behavioural patterns, for example, there are still places worth optimizing the logic of enemy generation, which can make the player's gaming experience more refreshing and challenging; the player's skill system can be expanded more, firstly, more genres can be developed to improve the richness of the game; secondly, the skill combinations can be made more flexible in order to improve the game's Secondly, the combination of skills can be made more flexible to improve the strategy of the game; in terms of interface design, clearer game guides or tutorials can be added to help new players quickly understand the rules of the game and the way of operation; consideration can be given to the addition of a simple achievement system or a points leaderboard to stimulate the players' interest in repeated challenges and competition; moreover, basic features such as auto-save and multiple archive slots can also be added in terms of the archive function to avoid the players losing their progress due to unforeseen circumstances. 

In addition, there are also a lot of places that can be optimised at the code level. Structurally, the decoupling between modules can be further enhanced to reduce the complexity of the code, and the error handling mechanism can be strengthened to make the game run more stable and easy to maintain.

In conclusion, this project has provided us with solid development experience and architectural design foundation, and in the future, we can further optimise and enrich the game content from these basic directions above, and continue to improve the player experience.

[Back to Table of Contents](#table-of-contents)
# 10 Contribution Statement

| Contributor   | Contribution |
|---------------|--------------|
| Weihao Zeng   | 1.00         |
| Lepeng Zhou   | 1.00         |
| Yichen Zhang  | 1.00         |
| Guojie Liu    | 1.00         |
| Chen Zhang    | 1.00         |
| Mengqiu Yan   | 1.00         |

[Back to Table of Contents](#table-of-contents)
# 11 Additional Marks

You can delete this section in your own repo, it's just here for information. in addition to the marks above, we will be marking you on the following two points:

- **Quality** of report writing, presentation, use of figures and visual material (5%) 
  - Please write in a clear concise manner suitable for an interested layperson. Write as if this repo was publicly available.

- **Documentation** of code (5%)

  - Is your repo clearly organised? 
  - Is code well commented throughout?


[Back to Table of Contents](#table-of-contents)
