'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from '@/navigation';
import { useAuth } from '@/context/useAuth';
import {
  formatGameTime,
  getGamePersonalBest,
  getLeaderboardEntries,
  LeaderboardEntry,
} from '../common/leaderboardStorage';
import {
  getGameLeaderboardAction,
  getGlobalLeaderboardAction,
  GlobalLeaderboardRecord,
  LeaderboardRecord,
} from '@/actions/gameLeaderboard';
import {
  checkAliasAvailabilityAction,
  getUserAliasAction,
  updateUserAliasAction,
} from '@/actions/userAlias';
import {
  FiAward,
  FiBox,
  FiCheck,
  FiCompass,
  FiEdit2,
  FiGlobe,
  FiGrid,
  FiPlay,
  FiStar,
  FiUser,
} from 'react-icons/fi';
import { LuBomb } from 'react-icons/lu';
import styles from './GamesHub.module.scss';
interface GameMeta {
  id: LeaderboardEntry['gameId'];
  title: string;
  category: string;
  icon: React.ElementType;
  iconBg: string;
  description: string;
  href: string;
}
const GAMES_LIST: GameMeta[] = [
  {
    id: 'word-path',
    title: 'Word Path',
    category: 'Word Puzzle',
    icon: FiCompass,
    iconBg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    description: 'Connect adjacent letters to trace hidden snake-words across responsive letter grids.',
    href: '/games/word-path',
  },
  {
    id: 'sudoku',
    title: 'Sudoku',
    category: 'Logic Grid',
    icon: FiGrid,
    iconBg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    description: 'Classic 9×9 mathematical puzzle with authentic unique solutions, pencil notes, and auto-check.',
    href: '/games/sudoku',
  },
  {
    id: 'minesweeper',
    title: 'Minesweeper',
    category: 'Retro Classic',
    icon: LuBomb,
    iconBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    description: 'Uncover safe cells without detonating hidden mines. Features first-click safety, chording, and zoom.',
    href: '/games/minesweeper',
  },
  {
    id: 'slide-puzzle',
    title: '15-Slide Puzzle',
    category: 'Number Slide',
    icon: FiBox,
    iconBg: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    description: 'Arrange scrambled 1 to 15 tiles into numerical order using fluid row & column sliding with solvability guarantee.',
    href: '/games/slide-puzzle',
  },
  {
    id: 'hitori',
    title: 'Hitori',
    category: 'Japanese Logic',
    icon: FiGrid,
    iconBg: 'linear-gradient(135deg, #475569 0%, #1e293b 100%)',
    description: 'Classic Japanese number puzzle. Shade duplicate numbers so no black cells touch and all white cells remain connected.',
    href: '/games/hitori',
  },
  {
    id: 'tango',
    title: 'Tango (Binairo)',
    category: 'Binary Logic',
    icon: FiGrid,
    iconBg: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
    description: 'Fill the grid with primary and light circles following equal, cross, and 3-in-a-row deduction rules.',
    href: '/games/tango',
  },
  {
    id: 'queens',
    title: 'Queens',
    category: 'Crown Logic',
    icon: FiAward,
    iconBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    description: 'Place exactly one Queen in every row, column, and colored region without Queens touching diagonally.',
    href: '/games/queens',
  },
];
export const GamesHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'games' | 'leaderboard'>('games');
  const [leaderboardFilter, setLeaderboardFilter] = useState<string>('all');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [dbEntries, setDbEntries] = useState<LeaderboardRecord[]>([]);
  const [globalRankings, setGlobalRankings] = useState<GlobalLeaderboardRecord[]>([]);
  const [personalBests, setPersonalBests] = useState<Record<string, LeaderboardEntry | null>>({});
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState<boolean>(false);
  const router = useRouter();
  // The hub exists to launch a game: warm all six (small, static) game routes up front so
  // "Play Now" lands instantly even for cards still below the fold on a phone.
  useEffect(() => {
    for (const g of GAMES_LIST) router.prefetch(g.href);
  }, [router]);
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const list = getLeaderboardEntries();
      setEntries(list);
      const pbMap: Record<string, LeaderboardEntry | null> = {};
      for (const g of GAMES_LIST) {
        pbMap[g.id] = getGamePersonalBest(g.id);
      }
      setPersonalBests(pbMap);
    });
    return () => cancelAnimationFrame(id);
  }, [activeTab]);
  useEffect(() => {
    if (activeTab !== 'leaderboard') return;
    let active = true;
    const frameId = requestAnimationFrame(() => {
      if (active) setIsLoadingLeaderboard(true);
    });
    Promise.all([
      getGlobalLeaderboardAction(25),
      getGameLeaderboardAction(leaderboardFilter, undefined, 25),
    ])
      .then(([globalRes, dbRes]) => {
        if (active) {
          setGlobalRankings(globalRes);
          setDbEntries(dbRes);
          setIsLoadingLeaderboard(false);
        }
      })
      .catch(() => {
        if (active) setIsLoadingLeaderboard(false);
      });
    return () => {
      active = false;
      cancelAnimationFrame(frameId);
    };
  }, [activeTab, leaderboardFilter]);
  const { user, token, refreshUser } = useAuth();
  const [aliasInput, setAliasInput] = useState<string>('');
  const [aliasEditing, setAliasEditing] = useState<boolean>(false);
  const [aliasChecking, setAliasChecking] = useState<boolean>(false);
  const [aliasError, setAliasError] = useState<string | null>(null);
  const [aliasSuccess, setAliasSuccess] = useState<string | null>(null);
  const [optimisticAlias, setOptimisticAlias] = useState<string | null>(null);
  useEffect(() => {
    if (user?.user_alias) {
      const frame = requestAnimationFrame(() => {
        setAliasInput(user.user_alias || '');
        setOptimisticAlias(user.user_alias || null);
      });
      return () => cancelAnimationFrame(frame);
    } else if (token) {
      void getUserAliasAction(token).then((res) => {
        if (res.alias) {
          requestAnimationFrame(() => {
            setAliasInput(res.alias || '');
            setOptimisticAlias(res.alias || null);
          });
        }
      });
    }
  }, [user?.user_alias, token]);
  const handleSaveAlias = async () => {
    if (!token) return;
    const clean = aliasInput.trim();
    setAliasError(null);
    setAliasSuccess(null);
    setAliasChecking(true);
    const check = await checkAliasAvailabilityAction(token, clean);
    if (!check.available) {
      setAliasError(check.error || 'Alias is unavailable');
      setAliasChecking(false);
      return;
    }
    const res = await updateUserAliasAction(token, clean);
    setAliasChecking(false);
    if (res.success) {
      setOptimisticAlias(clean);
      setAliasSuccess('Alias saved!');
      setAliasEditing(false);
      void refreshUser();
    } else {
      setAliasError(res.error || 'Failed to update alias');
    }
  };
  const getMedal = (idx: number) => {
    if (idx === 0) return <FiAward aria-label="1st Place" />;
    if (idx === 1) return <FiAward aria-label="2nd Place" />;
    if (idx === 2) return <FiAward aria-label="3rd Place" />;
    return `#${idx + 1}`;
  };
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Brain Games &amp; Puzzles</h1>
        <p className={styles.subtitle}>
          Challenge your mind with classic number puzzles, word searches, and logic games with persistent global rankings.
        </p>
        {user && (
          <div className={styles.aliasBar}>
            <div className={styles.aliasInfo}>
              <FiUser className={styles.aliasIcon} />
              <span className={styles.aliasLabel}>Player Alias:</span>
              {!aliasEditing ? (
                <span className={styles.currentAlias}>
                  {optimisticAlias ? `@${optimisticAlias}` : (user.user_alias ? `@${user.user_alias}` : (user.name || 'Anonymous Player'))}
                </span>
              ) : (
                <div className={styles.aliasEditGroup}>
                  <input
                    type="text"
                    value={aliasInput}
                    onChange={(e) => setAliasInput(e.target.value)}
                    placeholder="Enter unique alias"
                    maxLength={24}
                    className={styles.aliasInput}
                  />
                  <button
                    type="button"
                    disabled={aliasChecking}
                    onClick={handleSaveAlias}
                    className={styles.aliasSaveBtn}
                  >
                    <FiCheck /> {aliasChecking ? 'Checking...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAliasEditing(false);
                      setAliasInput(optimisticAlias || user.user_alias || '');
                      setAliasError(null);
                    }}
                    className={styles.aliasCancelBtn}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            {!aliasEditing && (
              <button
                type="button"
                onClick={() => setAliasEditing(true)}
                className={styles.aliasEditBtn}
              >
                <FiEdit2 size={13} /> {optimisticAlias || user.user_alias ? 'Change Alias' : 'Set Alias'}
              </button>
            )}
            {aliasError && <div className={styles.aliasErrorText}>{aliasError}</div>}
            {aliasSuccess && <div className={styles.aliasSuccessText}>{aliasSuccess}</div>}
          </div>
        )}
      </header>
      <div className={styles.tabBar} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'games'}
          className={`${styles.tabBtn} ${activeTab === 'games' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('games')}
        >
          <FiPlay aria-hidden="true" /> All Games
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'leaderboard'}
          className={`${styles.tabBtn} ${activeTab === 'leaderboard' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          <FiAward aria-hidden="true" /> Leaderboard
        </button>
      </div>
      {activeTab === 'games' && (
        <div className={styles.gamesGrid}>
          {GAMES_LIST.map((game) => {
            const pb = personalBests[game.id];
            const GameIcon = game.icon;
            return (
              <div key={game.id} className={styles.gameCard}>
                <div className={styles.cardHeader}>
                  <div
                    className={styles.iconBadge}
                    style={{ '--icon-bg': game.iconBg } as React.CSSProperties}
                  >
                    <GameIcon size={20} aria-hidden="true" />
                  </div>
                  <span className={styles.categoryBadge}>{game.category}</span>
                </div>
                <h2 className={styles.gameTitle}>{game.title}</h2>
                <p className={styles.gameDesc}>{game.description}</p>
                {pb && (
                  <div className={styles.bestScoreBadge}>
                    <FiStar aria-hidden="true" />
                    <span>
                      Best: {formatGameTime(pb.timeSeconds)}
                      {pb.totalPoints !== undefined ? ` • ${pb.totalPoints} pts` : ''}
                    </span>
                  </div>
                )}
                <div className={styles.cardFooter}>
                  <Link href={game.href} className={styles.playBtn}>
                    Play Now
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {activeTab === 'leaderboard' && (
        <div className={styles.leaderboardSection}>
          <div className={styles.filterRow}>
            <button
              type="button"
              className={`${styles.filterBtn} ${leaderboardFilter === 'all' ? styles.filterBtnActive : ''}`}
              onClick={() => setLeaderboardFilter('all')}
            >
              <FiGlobe aria-hidden="true" /> Global Overall
            </button>
            {GAMES_LIST.map((g) => (
              <button
                key={g.id}
                type="button"
                className={`${styles.filterBtn} ${leaderboardFilter === g.id ? styles.filterBtnActive : ''}`}
                onClick={() => setLeaderboardFilter(g.id)}
              >
                {g.title}
              </button>
            ))}
          </div>
          {isLoadingLeaderboard ? (
            <div className={styles.emptyState}>
              <p>Loading leaderboard rankings...</p>
            </div>
          ) : leaderboardFilter === 'all' ? (
            <div className={styles.tableWrapper}>
              {globalRankings.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No global player records yet.</p>
                  <p className={styles.emptySubtext}>
                    Complete any puzzle game to earn points and claim your spot on the podium!
                  </p>
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Rank</th>
                      <th className={styles.th}>Player</th>
                      <th className={styles.th}>Games Played</th>
                      <th className={styles.th}>Total Points</th>
                      <th className={styles.th}>Top Game</th>
                    </tr>
                  </thead>
                  <tbody>
                    {globalRankings.map((r, idx) => (
                      <tr key={r.userId} className={idx < 3 ? styles.topRow : ''}>
                        <td className={styles.td}>
                          <span className={styles.medal}>{getMedal(idx)}</span>
                        </td>
                        <td className={`${styles.td} ${styles.tdBold}`}>
                          {r.playerName}
                        </td>
                        <td className={styles.td}>{r.totalGames}</td>
                        <td className={`${styles.td} ${styles.tdRankFirst}`}>
                          {r.totalPoints.toLocaleString()}
                        </td>
                        <td className={`${styles.td} ${styles.tdCapitalize}`}>
                          {r.bestGame}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              {(dbEntries.length > 0 ? dbEntries : entries.filter((e) => e.gameId === leaderboardFilter)).length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No high scores recorded yet for this game.</p>
                  <p className={styles.emptySubtext}>
                    Play a round to record your score on the leaderboard!
                  </p>
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Rank</th>
                      <th className={styles.th}>Player</th>
                      <th className={styles.th}>Game</th>
                      <th className={styles.th}>Difficulty</th>
                      <th className={styles.th}>Time</th>
                      <th className={styles.th}>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(dbEntries.length > 0
                      ? dbEntries
                      : entries
                          .filter((e) => e.gameId === leaderboardFilter)
                          .map((e, idx) => ({
                            id: e.id,
                            playerName: e.playerName || 'Player',
                            gameId: e.gameId,
                            difficulty: e.difficulty,
                            timeSeconds: e.timeSeconds,
                            totalPoints: e.totalPoints ?? (e.score ? e.score * 10 : 500),
                            rank: idx + 1,
                          }))
                    ).map((e, idx) => (
                      <tr key={e.id} className={idx < 3 ? styles.topRow : ''}>
                        <td className={styles.td}>
                          <span className={styles.medal}>{getMedal(idx)}</span>
                        </td>
                        <td className={`${styles.td} ${styles.tdSemiBold}`}>
                          {(e as LeaderboardRecord).playerName || 'Player'}
                        </td>
                        <td className={`${styles.td} ${styles.tdSemiBold} ${styles.tdCapitalize}`}>
                          {e.gameId}
                        </td>
                        <td className={`${styles.td} ${styles.tdCapitalize}`}>
                          {e.difficulty}
                        </td>
                        <td className={`${styles.td} ${styles.tdTime}`}>
                          {formatGameTime(e.timeSeconds)}
                        </td>
                        <td className={`${styles.td} ${styles.tdPoints}`}>
                          {e.totalPoints !== undefined ? e.totalPoints.toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default GamesHub;
