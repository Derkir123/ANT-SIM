import './style.css';
import { MainMenu } from './ui/screens/MainMenu';
import { NewGame } from './ui/screens/NewGame';
import { LoadGame } from './ui/screens/LoadGame';
import { Settings } from './ui/screens/Settings';
import { Help } from './ui/screens/Help';
import { About } from './ui/screens/About';
import { Achievements } from './ui/screens/Achievements';
import { GamePlaceholder } from './ui/screens/GamePlaceholder';
import { DIFFICULTY, Difficulty } from './data/constants';

const mainMenu = new MainMenu();
const newGameScreen = new NewGame(DIFFICULTY.BEGINNER as Difficulty);
const loadGameScreen = new LoadGame();
const settingsScreen = new Settings();
const helpScreen = new Help();
const aboutScreen = new About();
const achievementsScreen = new Achievements();
const gamePlaceholder = new GamePlaceholder();

mainMenu.show();