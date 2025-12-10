# 🚦 Smart Traffic Control System - DFA Simulation

[![GitHub](https://img.shields.io/github/license/ABHAYRAJYADAV19/TrafficSimulationUsingDfa)](https://github.com/ABHAYRAJYADAV19/TrafficSimulationUsingDfa/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/ABHAYRAJYADAV19/TrafficSimulationUsingDfa)](https://github.com/ABHAYRAJYADAV19/TrafficSimulationUsingDfa/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/ABHAYRAJYADAV19/TrafficSimulationUsingDfa)](https://github.com/ABHAYRAJYADAV19/TrafficSimulationUsingDfa/issues)
[![GitHub last commit](https://img.shields.io/github/last-commit/ABHAYRAJYADAV19/TrafficSimulationUsingDfa)](https://github.com/ABHAYRAJYADAV19/TrafficSimulationUsingDfa/commits/main)

A high-fidelity, interactive traffic control dashboard implementing a **Deterministic Finite Automaton (DFA)** for state management. This project simulates a professional "Control Center" environment with real-time visualization of traffic light states and DFA transitions.

<p align="center">
  <img src="https://img.icons8.com/fluency/96/000000/traffic-light.png" alt="Traffic Light" />
</p>

## 🌟 Features

### 🔧 Core DFA Implementation

- **TrafficDFA Class**: Implements a complete Deterministic Finite Automaton with states (Q), input alphabet (Σ), transition function (δ), initial state (q₀), and accept states (F)
- **State Management**: Handles transitions between Red → Green → Yellow states with proper mathematical modeling
- **Input Processing**: Accepts inputs including tick(), emergencyOverride(), and changeSettings()

### 🎨 Visualization & UI

- **Real-time Traffic Lights**: CSS-powered traffic lights with glow effects and smooth transitions
- **Live DFA State Diagram**: Canvas-based visualization showing all states with active state highlighting
- **Current Tuple Display**: Terminal-like display showing mathematical state transitions:
  ```
  Current State: q0 (NS_GREEN_EW_RED) | Input: TIMER_EXPIRED | Next State: q1 (NS_YELLOW_EW_RED)
  ```

### 🛠️ Admin Control Panel

- **Secure Access**: PIN-protected login (1234) for admin controls
- **Timing Configuration**: Adjustable durations for all light states with localStorage persistence
- **Manual Controls**:
  - Force Red/Green overrides
  - Emergency mode activation
  - Pedestrian crossing requests
- **Simulation Controls**: Play/Pause/Reset functionality with speed adjustment (0.5x to 5x)

### 📊 Analytics & Logging

- **Event Logger**: Timestamped log of all state changes and user actions
- **Persistent Storage**: Last 50 events saved to localStorage
- **Time Distribution**: Visual progress bars showing time spent in each state
- **Performance Metrics**: Tracking of total transitions and system uptime

### 📱 Design & Responsiveness

- **Cyberpunk Theme**: Dark mode interface with neon accent colors
- **Glassmorphism Effects**: Frosted glass panels with subtle shadows
- **Mobile-First Design**: Fully responsive layout adapting to all screen sizes
- **Interactive Elements**: Hover effects, transitions, and visual feedback

## 📁 File Structure

```
├── control-center.html     # Main application structure
├── control-center.css      # Styling and visual design
├── control-center.js       # DFA logic and application functionality
├── index.html             # Original traffic light simulation
├── style.css              # Styles for original simulation
├── script.js              # Logic for original simulation
├── workflow.html          # Workflow visualization
├── workflow.css           # Styles for workflow page
├── workflow.js            # Logic for workflow page
├── dfa.html               # DFA explanation page
├── dfa.css                # Styles for DFA page
└── dfa.js                 # Logic for DFA page
```

## 📘 Technical Specifications

### DFA Components

- **States (Q)**:
  - NS_GREEN_EW_RED (q0)
  - NS_YELLOW_EW_RED (q1)
  - NS_RED_EW_GREEN (q2)
  - NS_RED_EW_YELLOW (q3)
  - PEDESTRIAN_WALK (q4)
- **Input Alphabet (Σ)**:

  - TIMER_EXPIRED
  - EMERGENCY_OVERRIDE
  - PEDESTRIAN_REQUEST
  - FORCE_RED
  - FORCE_GREEN

- **Transition Function (δ)**: Defined in `getNextState()` method
- **Initial State (q₀)**: NS_GREEN_EW_RED
- **Accept States (F)**: All states are accept states

### Technologies Used

- **HTML5**: Semantic markup and canvas for visualization
- **CSS3**: Flexbox/Grid layout, custom properties, animations
- **Vanilla JavaScript (ES6+)**: Classes, modules, and modern syntax
- **LocalStorage**: Configuration and event log persistence

## ▶️ Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/ABHAYRAJYADAV19/TrafficSimulationUsingDfa.git
   ```

2. Navigate to the project directory:

   ```bash
   cd TrafficSimulationUsingDfa
   ```

3. Open `control-center.html` in a modern web browser

4. Enter PIN `1234` to access the control center

5. Use the dashboard to configure timings, control simulation, and monitor states

### ⚙️ Default Configuration

- North-South Green: 15 seconds
- North-South Yellow: 3 seconds
- East-West Green: 15 seconds
- East-West Yellow: 3 seconds
- Pedestrian Walk: 10 seconds

## 🕹️ Key Interactions

| Control               | Function                             |
| --------------------- | ------------------------------------ |
| ▶️ Play/Pause         | Start or pause the simulation        |
| 🔄 Reset              | Return to initial state              |
| 🚀 Speed Slider       | Adjust simulation speed (0.5x to 5x) |
| 🛑 Force Red          | Immediately set all lights to red    |
| 🚨 Emergency Mode     | Activate emergency override          |
| 🚶 Pedestrian Request | Queue pedestrian crossing            |
| 💾 Save Settings      | Persist timing configuration         |

## 🎓 Educational Value

This simulation demonstrates:

- Formal DFA implementation in a real-world system
- State transition logic with mathematical precision
- Event-driven programming with JavaScript
- Responsive UI design principles
- Client-side data persistence techniques

## 🌐 Browser Support

Optimized for modern browsers supporting:

- ES6+ JavaScript features
- CSS Grid and Flexbox
- Canvas API
- LocalStorage API

Tested on Chrome, Firefox, Safari, and Edge.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Abhay Raj Yadav**

- GitHub: [@ABHAYRAJYADAV19](https://github.com/ABHAYRAJYADAV19)
- Email: abhayraju5@gmail.com

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- Icons by [Icons8](https://icons8.com)
- Inspired by real-world traffic control systems
- Built with educational purposes in mind

---

<p align="center">
  Made with ❤️ and JavaScript
</p>
