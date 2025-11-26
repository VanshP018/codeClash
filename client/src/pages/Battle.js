import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateBoilerplate, generateTestCode } from '../utils/boilerplateGenerator';
import { getLanguageConfig, getAvailableLanguages } from '../utils/languageConfig';
import CodeEditor from '../components/CodeEditor';
import SubmitModal from '../components/SubmitModal';
import FinalScoreboard from '../components/FinalScoreboard';
import Timer from '../components/Timer';
import LeaveNotification from '../components/LeaveNotification';
import './Battle.css';

const Battle = ({ user, refreshUser }) => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [codeInput, setCodeInput] = useState('def solution():\n    # Write your code here\n');
  const [language, setLanguage] = useState('python');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [testResult, setTestResult] = useState(null); // 'pass', 'fail', or null
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitTestResults, setSubmitTestResults] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionChanging, setQuestionChanging] = useState(false);
  const [previousQuestionId, setPreviousQuestionId] = useState(null);
  const [scores, setScores] = useState({});
  const [participants, setParticipants] = useState([]);
  const hasUserEditedCode = useRef(false);
  const lastSetQuestionId = useRef(null);
  const [questionsCompleted, setQuestionsCompleted] = useState(0);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [showFinalScoreboard, setShowFinalScoreboard] = useState(false);
  const [timerStartedAt, setTimerStartedAt] = useState(null);
  const [timerDuration, setTimerDuration] = useState(1800000); // 30 minutes
  const [timeExpired, setTimeExpired] = useState(false);
  const [leaveNotification, setLeaveNotification] = useState(null);
  const lastLeaveTimestamp = useRef(null);
  const [outputHeight, setOutputHeight] = useState(200);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartY = useRef(0);
  const resizeStartHeight = useRef(0);

  // Refresh user data when component mounts (for participants entering battle)
  useEffect(() => {
    if (refreshUser) {
      refreshUser();
    }
  }, [refreshUser]);

  // Handle window resize
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      
      const deltaY = resizeStartY.current - e.clientY;
      const newHeight = Math.max(150, Math.min(600, resizeStartHeight.current + deltaY));
      setOutputHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleResizeStart = (e) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartY.current = e.clientY;
    resizeStartHeight.current = outputHeight;
  };

  useEffect(() => {
    const fetchBattleQuestion = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Get room details
        const roomResponse = await fetch(`http://localhost:5001/api/rooms/${code}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const roomData = await roomResponse.json();

        if (!roomData.success) {
          setError(roomData.message);
          setLoading(false);
          return;
        }

        // Check if battle started and has questionId
        const room = roomData.room;
        
        // Update scores and participants
        if (room.scores) {
          setScores(room.scores);
        }
        if (room.participants) {
          setParticipants(room.participants);
        }
        if (room.questionsCompleted !== undefined) {
          setQuestionsCompleted(room.questionsCompleted);
        }
        if (room.timerStartedAt) {
          setTimerStartedAt(room.timerStartedAt);
        }
        if (room.timerDuration) {
          setTimerDuration(room.timerDuration);
        }
        if (room.sessionEnded && !showFinalScoreboard) {
          setSessionEnded(true);
          setShowFinalScoreboard(true);
        }

        // Check for recent leave notification
        if (room.recentLeave && room.recentLeave.timestamp) {
          const leaveTime = new Date(room.recentLeave.timestamp).getTime();
          // Only show notification if it's new (not shown before)
          if (lastLeaveTimestamp.current !== leaveTime) {
            lastLeaveTimestamp.current = leaveTime;
            setLeaveNotification({
              username: room.recentLeave.username,
              timestamp: leaveTime
            });
          }
        }
        
        if (!room.battleStarted || !room.questionId) {
          setError('Battle not started yet');
          setLoading(false);
          return;
        }

        // Fetch question from question bank
        const questionResponse = await fetch('/questionBank.json');
        const questionBankData = await questionResponse.json();
        
        const selectedQuestion = questionBankData.questions.find(
          q => q.id === room.questionId
        );

        if (selectedQuestion) {
          // Check if question has changed using ref for reliability
          const questionChanged = lastSetQuestionId.current !== null && lastSetQuestionId.current !== room.questionId;
          const isInitialLoad = lastSetQuestionId.current === null;
          
          console.log('[Polling] Room Question ID:', room.questionId, 'Last Set:', lastSetQuestionId.current, 'Changed:', questionChanged, 'Initial:', isInitialLoad);
          
          if (questionChanged) {
            console.log('Question changed from', lastSetQuestionId.current, 'to', room.questionId);
          }
          
          setQuestion(selectedQuestion);
          
          // Set boilerplate ONLY on initial load OR when question changes
          if (isInitialLoad || questionChanged) {
            console.log('Setting boilerplate for question ID:', room.questionId);
            const boilerplate = generateBoilerplate(selectedQuestion, language);
            setCodeInput(boilerplate);
            lastSetQuestionId.current = room.questionId; // Store in ref
            setPreviousQuestionId(room.questionId);
            setOutput('');
            setTestResult(null);
            hasUserEditedCode.current = false; // Reset edit flag for new question
          }
          
          setError('');
        } else {
          setError('Question not found');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching battle question:', err);
        setError('Error loading battle question');
        setLoading(false);
      }
    };

    fetchBattleQuestion();
    // Poll for updates every 2 seconds
    const interval = setInterval(fetchBattleQuestion, 2000);
    return () => clearInterval(interval);
  }, [code]); // Only depend on code, not on state that changes internally

  const handleRunCode = async () => {
    if (!codeInput.trim()) {
      setOutput('Error: Please write some code first');
      setTestResult(null);
      return;
    }

    setIsRunning(true);
    setOutput('Running code...\n');
    setTestResult(null);
    
    try {
      // Append test code to user's solution automatically
      const testCode = generateTestCode(question, language);
      const fullCode = codeInput + testCode;
      
      const langConfig = getLanguageConfig(language);
      
      // Using Piston API for code execution
      const response = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: langConfig.id,
          version: langConfig.version,
          files: [
            {
              name: `main.${langConfig.extension}`,
              content: fullCode
            }
          ],
          stdin: '',
          args: [],
          compile_timeout: 10000,
          run_timeout: 3000,
          compile_memory_limit: -1,
          run_memory_limit: -1
        })
      });

      const data = await response.json();

      if (data.run) {
        let outputText = '';
        let actualOutput = '';
        
        if (data.run.stdout) {
          actualOutput = data.run.stdout.trim();
          outputText += '=== Output ===\n' + data.run.stdout;
        }
        
        if (data.run.stderr) {
          outputText += '\n=== Errors ===\n' + data.run.stderr;
          setTestResult('fail');
        }
        
        if (data.run.code !== 0) {
          outputText += `\n\nExit code: ${data.run.code}`;
          setTestResult('fail');
        }
        
        if (!data.run.stdout && !data.run.stderr) {
          outputText = 'Code executed successfully with no output.';
        }

        // Compare with expected output from sample testcase
        if (question && question.sample_testcase && actualOutput && !data.run.stderr && data.run.code === 0) {
          const expectedOutput = String(question.sample_testcase.output).trim();
          const normalizedActual = actualOutput.replace(/\s+/g, ' ');
          const normalizedExpected = expectedOutput.replace(/\s+/g, ' ');
          
          if (normalizedActual === normalizedExpected) {
            setTestResult('pass');
            outputText += `\n\n✓ Sample test case passed!`;
          } else {
            setTestResult('fail');
            outputText += `\n\n✗ Sample test case failed`;
            outputText += `\nExpected: ${expectedOutput}`;
            outputText += `\nGot: ${actualOutput}`;
          }
        }

        setOutput(outputText || 'No output');
      } else {
        setOutput('Error: Failed to execute code');
        setTestResult('fail');
      }
    } catch (err) {
      setOutput('Error executing code: ' + err.message);
      setTestResult('fail');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!question || !question.testcases) {
      alert('No test cases available for this question');
      return;
    }

    // Initialize test results
    const initialResults = question.testcases.map((_, index) => ({
      status: 'pending',
      expected: null,
      actual: null,
      error: null
    }));
    
    setSubmitTestResults(initialResults);
    setShowSubmitModal(true);
    setIsSubmitting(true);

    // Run test cases one by one
    let allPassed = true;
    for (let i = 0; i < question.testcases.length; i++) {
      const testcase = question.testcases[i];
      
      // Update status to running
      setSubmitTestResults(prev => {
        const updated = [...prev];
        updated[i] = { ...updated[i], status: 'running' };
        return updated;
      });

      try {
        // Generate code with test case input
        // Start with user's solution
        let testCode = codeInput;
        
        // Parse the input and create appropriate function call
        const input = testcase.input;
        let functionCall = '';
        
        if (typeof input === 'object' && !Array.isArray(input)) {
          // Object input (multiple parameters)
          const params = Object.keys(input);
          const args = params.map(p => JSON.stringify(input[p])).join(', ');
          functionCall = `result = solution(${args})`;
        } else if (Array.isArray(input)) {
          functionCall = `result = solution(${JSON.stringify(input)})`;
        } else if (typeof input === 'string') {
          functionCall = `result = solution("${input}")`;
        } else {
          functionCall = `result = solution(${input})`;
        }

        // Append test code based on language
        const langConfig = getLanguageConfig(language);
        let testCodeAppend = '';
        
        if (language === 'python') {
          testCodeAppend = `\n\nif __name__ == "__main__":\n    ${functionCall}\n    print(result)`;
        } else if (language === 'cpp') {
          testCodeAppend = `\nint main() {\n    ${functionCall};\n    cout << result << endl;\n    return 0;\n}\n`;
        } else if (language === 'java') {
          testCodeAppend = `\npublic class Main {\n    public static void main(String[] args) {\n        Solution solution = new Solution();\n        Object ${functionCall.replace('solution', 'result = solution.solution')};\n        System.out.println(result);\n    }\n}\n`;
        }
        
        testCode += testCodeAppend;

        // Execute code
        const response = await fetch('https://emkc.org/api/v2/piston/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language: langConfig.id,
            version: langConfig.version,
            files: [{ name: `main.${langConfig.extension}`, content: testCode }],
            stdin: '',
            args: [],
            compile_timeout: 10000,
            run_timeout: 3000
          })
        });

        const data = await response.json();

        if (data.run && data.run.code === 0 && !data.run.stderr) {
          const actualOutput = data.run.stdout.trim();
          const expectedOutput = String(testcase.output).trim();
          
          const normalizedActual = actualOutput.replace(/\s+/g, ' ');
          const normalizedExpected = expectedOutput.replace(/\s+/g, ' ');

          if (normalizedActual === normalizedExpected) {
            // Test passed
            setSubmitTestResults(prev => {
              const updated = [...prev];
              updated[i] = {
                status: 'passed',
                expected: expectedOutput,
                actual: actualOutput,
                error: null
              };
              return updated;
            });
          } else {
            // Test failed
            allPassed = false;
            setSubmitTestResults(prev => {
              const updated = [...prev];
              updated[i] = {
                status: 'failed',
                expected: expectedOutput,
                actual: actualOutput,
                error: 'Output mismatch'
              };
              return updated;
            });
          }
        } else {
          // Execution error
          allPassed = false;
          setSubmitTestResults(prev => {
            const updated = [...prev];
            updated[i] = {
              status: 'failed',
              expected: String(testcase.output),
              actual: data.run?.stderr || 'Execution error',
              error: 'Runtime error'
            };
            return updated;
          });
        }
      } catch (err) {
        allPassed = false;
        setSubmitTestResults(prev => {
          const updated = [...prev];
          updated[i] = {
            status: 'failed',
            expected: String(testcase.output),
            actual: err.message,
            error: 'Execution failed'
          };
          return updated;
        });
      }

      // Small delay between tests for visual effect
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsSubmitting(false);

    // If all tests passed, notify backend to change question
    if (allPassed) {
      console.log('All tests passed! Notifying backend to change question...');
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5001/api/rooms/submit/${code}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ allPassed: true })
        });

        const data = await response.json();
        console.log('Submit response:', data);
        
        // Check if time expired during submission
        if (data.timeExpired) {
          console.log('Time expired! Showing final scoreboard');
          setTimeout(() => {
            setShowSubmitModal(false);
            setTimeExpired(true);
            setSessionEnded(true);
            setShowFinalScoreboard(true);
          }, 2000);
          return;
        }
        
        if (data.success) {
          // Update questions completed count immediately
          if (data.questionsCompleted !== undefined) {
            setQuestionsCompleted(data.questionsCompleted);
          }
          
          if (data.sessionEnded) {
            // Session ended after 3 questions
            console.log('Session ended! Showing final scoreboard');
            setTimeout(() => {
              setShowSubmitModal(false);
              setSessionEnded(true);
              setShowFinalScoreboard(true);
            }, 3000);
          } else if (data.questionChanged) {
            console.log('Question changed to:', data.newQuestionId);
            // Wait 3 seconds before closing modal and refreshing
            setTimeout(() => {
              setShowSubmitModal(false);
              setQuestionChanging(true);
              
              // Clear the question changing message after 2 seconds
              setTimeout(() => {
                setQuestionChanging(false);
              }, 2000);
            }, 3000);
          }
        } else {
          console.log('Question not changed or no more questions available');
        }
      } catch (err) {
        console.error('Error submitting solution:', err);
      }
    }
  };

  const handleLeave = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/rooms/leave/${code}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inBattle: true })
      });

      const data = await response.json();
      
      if (data.success) {
        // Navigate to dashboard
        navigate('/dashboard');
      } else {
        console.error('Failed to leave room:', data.message);
        // Still navigate even if there's an error
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Error leaving battle:', err);
      // Still navigate even if there's an error
      navigate('/dashboard');
    }
  };

  const handleLanguageChange = (newLanguage) => {
    if (hasUserEditedCode.current) {
      if (!window.confirm('Changing language will reset your code. Continue?')) {
        return;
      }
    }
    
    setLanguage(newLanguage);
    const boilerplate = generateBoilerplate(question, newLanguage);
    setCodeInput(boilerplate);
    setOutput('');
    setTestResult(null);
    hasUserEditedCode.current = false;
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const value = e.target.value;
      
      // Insert 4 spaces at cursor position
      const newValue = value.substring(0, start) + '    ' + value.substring(end);
      setCodeInput(newValue);
      
      // Move cursor after the inserted spaces
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 4;
      }, 0);
    }
  };

  const handleTimeExpired = () => {
    console.log('[Timer] Time expired!');
    setTimeExpired(true);
    setSessionEnded(true);
    setShowFinalScoreboard(true);
  };

  if (loading) {
    return (
      <div className="battle-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading battle...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="battle-page">
        <div className="error-container">
          <p>{error}</p>
          <button onClick={handleLeave} className="back-btn">Back to Room</button>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="battle-page">
        <div className="error-container">
          <p>No question available</p>
          <button onClick={handleLeave} className="back-btn">Back to Room</button>
        </div>
      </div>
    );
  }

  return (
    <div className="battle-page">
      {/* Leave Notification */}
      {leaveNotification && (
        <LeaveNotification
          username={leaveNotification.username}
          onClose={() => setLeaveNotification(null)}
        />
      )}

      {/* Question Changing Overlay */}
      {questionChanging && (
        <div className="question-changing-overlay">
          <div className="changing-content">
            <div className="spinner-large"></div>
            <h2>Loading Next Question...</h2>
            <p>All participants are moving to a new challenge!</p>
          </div>
        </div>
      )}

      {/* Question Panel - Left Side */}
      <div className="question-panel">
        <div className="question-header">
          <div className="question-title-row">
            <h2>{question.title}</h2>
            <div className="title-right-section">
              {timerStartedAt && !sessionEnded && (
                <Timer 
                  timerStartedAt={timerStartedAt}
                  timerDuration={timerDuration}
                  onTimeExpired={handleTimeExpired}
                />
              )}
              <span className={`difficulty-badge ${question.difficulty.toLowerCase()}`}>
                {question.difficulty}
              </span>
            </div>
          </div>
          <div className="question-tags">
            {question.tags.map((tag, index) => (
              <span key={index} className="tag">{tag}</span>
            ))}
          </div>
        </div>

        <div className="question-content">
          <section className="question-section">
            <h3>Problem Statement</h3>
            <p>{question.description}</p>
          </section>

          <section className="question-section">
            <h3>Input Format</h3>
            <div className="format-box">
              {typeof question.input_format === 'object' ? (
                Object.entries(question.input_format).map(([key, value]) => (
                  <div key={key}>
                    <strong>{key}:</strong> {value}
                  </div>
                ))
              ) : (
                <p>{question.input_format}</p>
              )}
            </div>
          </section>

          <section className="question-section">
            <h3>Output Format</h3>
            <div className="format-box">
              <p>{question.output_format}</p>
            </div>
          </section>

          <section className="question-section">
            <h3>Constraints</h3>
            <div className="format-box">
              <p>{question.constraints}</p>
            </div>
          </section>

          <section className="question-section">
            <h3>Sample Test Case</h3>
            <div className="testcase-box">
              <div className="testcase-item">
                <strong>Input:</strong>
                <pre>{JSON.stringify(question.sample_testcase.input, null, 2)}</pre>
              </div>
              <div className="testcase-item">
                <strong>Output:</strong>
                <pre>{JSON.stringify(question.sample_testcase.output, null, 2)}</pre>
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* Code Editor Panel - Right Side */}
      <div className="editor-panel">
        <div className="editor-header">
          <div className="editor-controls">
            <div className="language-selector">
              <label htmlFor="language-dropdown">Language:</label>
              <select 
                id="language-dropdown"
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="language-dropdown"
              >
                {getAvailableLanguages().map(lang => (
                  <option key={lang.id} value={lang.id}>
                    {lang.icon} {lang.displayName}
                  </option>
                ))}
              </select>
            </div>
            <div className="progress-indicator">
              <span className="progress-label">Question</span>
              <span className="progress-value">{questionsCompleted + 1}/3</span>
            </div>
            <div className="user-score">
              <span className="score-label">Your Score:</span>
              <span className="score-value">{user && scores[user.id || user._id] ? scores[user.id || user._id] : 0}</span>
            </div>
            <button onClick={handleLeave} className="leave-battle-btn">
              ← Leave Battle
            </button>
          </div>
        </div>

        <div className="code-editor">
          <CodeEditor
            value={codeInput}
            onChange={(e) => {
              setCodeInput(e.target.value);
              hasUserEditedCode.current = true;
            }}
            onKeyDown={handleKeyDown}
            language={language}
          />
        </div>

        <div className="resize-handle" onMouseDown={handleResizeStart}>
          <div className="resize-handle-line"></div>
        </div>

        <div className="output-section" style={{ height: `${outputHeight}px` }}>
          <div className="output-header">
            <div className="output-title-wrapper">
              <h4>Output</h4>
              {testResult === 'pass' && (
                <span className="test-result-badge test-pass">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" fill="#00b8a3" />
                    <path d="M4 8l2.5 2.5L12 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Passed
                </span>
              )}
              {testResult === 'fail' && (
                <span className="test-result-badge test-fail">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" fill="#ef476f" />
                    <path d="M5 5l6 6M11 5l-6 6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Failed
                </span>
              )}
            </div>
            <div className="action-buttons">
              <button 
                onClick={handleRunCode} 
                disabled={isRunning}
                className="run-btn"
              >
                {isRunning ? 'Running...' : '▶ Run Code'}
              </button>
              <button 
                onClick={handleSubmit}
                className="submit-btn"
              >
                Submit
              </button>
            </div>
          </div>
          <div className="output-content">
            <pre>{output || 'Run your code to see output...'}</pre>
          </div>
        </div>
      </div>

      {/* Submit Modal */}
      <SubmitModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        testResults={submitTestResults}
        isRunning={isSubmitting}
        allPassed={submitTestResults.length > 0 && submitTestResults.every(r => r.status === 'passed')}
      />

      <FinalScoreboard
        isOpen={showFinalScoreboard}
        participants={participants}
        scores={scores}
        timeExpired={timeExpired}
        questionsCompleted={questionsCompleted}
        onClose={() => {
          setShowFinalScoreboard(false);
          navigate('/dashboard');
        }}
      />
    </div>
  );
};

export default Battle;
