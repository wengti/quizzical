import { useState, useMemo, useRef, useEffect } from 'react'
import { useReward } from 'react-rewards'
import { decode } from 'html-entities'
import { clsx } from 'clsx'

export function Quiz({ questions: appQuestions, fetchQuestions, categories: availableCategories, errorMsg, handleHome }) {

    // State
    const [questions, setQuestions] = useState(appQuestions)
    const [selectedAnswers, setSelectedAnswers] = useState(() => new Array(questions.results.length).fill(""))
    const [score, setScore] = useState(-1)
    const [disableRadio, setDisableRadio] = useState(false) //Freeze button when loading
    const [errorCode, setErrorCode] = useState(0)
    const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false)
    const [isForceSubmitted, setIsForceSubmitted] = useState(false)


    // Time
    const timeGivenPerQuestions = 5000 // - miliseconds 
    const initialTimeLeft = appQuestions.results.length * timeGivenPerQuestions //- each question gets 5s
    const [timeLeft, setTimeLeft] = useState(initialTimeLeft)
    const timeLeftSecond = String(Math.floor((timeLeft % (60 * 1000)) / 1000)).padStart(2, "0")
    const timeLeftMinute = String(Math.floor((timeLeft / (60 * 1000)))).padStart(2, "0")

    const timerRef = useRef(null)


    // Ref
    const btnRefs = useRef({})

    function addBtnRef(node, name) {
        btnRefs.current[name] = node
    }

    // Deduce the game config from the current questions
    const amount = questions.results.length
    const difficulty = questions.results[0].difficulty
    const uniqueCategory = [...new Set(questions.results.map(result => decode(result.category)))]
    const category = uniqueCategory.length > 1
        ? "Mixed"
        : uniqueCategory[0]


    // Derived State - isWon should always be used in combination with score >= 0, makes
    // it a condition that will only be checked after the game has been concluded.
    let isWon = ""
    if (score > (questions.results.length * 0.5) && timeLeft >= 0 && !isForceSubmitted) {
        isWon = true
    } else if (timeLeft <= 0) {
        isWon = false

        if (!isForceSubmitted) {
            handleCheckAnswer() // queue for another re-render
            setTimeLeft(0) //So this condition doesnt get infinite-looped
            setIsForceSubmitted(true)
        }
    }

    // rain effect to be used
    const { reward: winEffect, isAnimating: isWinEffectAnimating } = useReward(
        'rewardEl',
        'emoji',
        {
            angle: 270,
            spread: 180,
            startVelocity: 10,
            emoji: ['🤓', '😊', '🥳']
        }
    )
    const { reward: loseEffect, isAnimating: isLoseEffectAnimating } = useReward(
        'rewardEl',
        'emoji',
        {
            angle: 270,
            spread: 180,
            startVelocity: 10,
            emoji: ['🗑️', '😠', '😡']
        }
    )

    // --------
    // Elements
    // --------

    // useMemo so it doesnt simply get re-rendered every single time
    const questionElements = useMemo(() => {

        const entries = questions.results
        return entries.map((entry, qIdx) => {

            const answersElements = entry.answers.map((answer, aIdx) => {

                const answerId = `q${qIdx}a${aIdx}`
                const answerStyle = clsx({
                    selected: answer === selectedAnswers[qIdx] && score < 0,
                    correct: answer === questions.results[qIdx].correct_answer && score >= 0,
                    wrong: answer !== questions.results[qIdx].correct_answer && answer === selectedAnswers[qIdx] && score >= 0,
                    selectedReveal: answer === selectedAnswers[qIdx] && score >= 0
                })

                return (
                    <div key={answerId}>
                        <input
                            type='radio'
                            id={answerId}
                            name={qIdx}
                            value={answer}
                            onChange={(event) => { handleChangeAnswer(event, qIdx) }}
                            disabled={disableRadio}

                        />
                        <label
                            htmlFor={answerId}
                            className={answerStyle}
                        >{decode(answer)}
                        </label>
                    </div>
                )
            })

            return (
                <div className='questions-outer-container' key={entry.question}>
                    <p className="questions">{decode(entry.question)}</p>
                    <div className="answers-outer-container">
                        {answersElements}
                    </div>
                </div>

            )
        })
    }, [selectedAnswers, score, questions])

    const actionElements = useMemo(() => {
        if (score >= 0) {

            const lessThanHalf = (score <= (questions.results.length * 0.5)) ? "Scoring less than 50%" : ""
            const outOfTime = isForceSubmitted ? "Running out of time" : ""
            const loseReasons = outOfTime ? lessThanHalf + " & " + outOfTime : lessThanHalf

            return (
                <>
                    {isWon
                        ? <p className='score-msg win-msg'>You Won!</p>
                        :
                        <>
                            <p className='score-msg lose-msg'>You lose!</p>
                            <p className='score-msg lose-msg'>{loseReasons}...</p>
                        </>
                    }
                    <p className='score-msg main-msg'>You scored {score}/{questions.results.length} correct answers</p>
                    <div className='end-action-container'>
                        <button
                            onClick={handlePlayAgain}
                            ref={(node) => {
                                const name = "playAgainBtn"
                                addBtnRef(node, name)
                                return () => {
                                    delete btnRefs.current[name]
                                }
                            }}
                        >
                            Play again
                        </button>
                        <button
                            onClick={handleHome}
                            ref={(node) => {
                                const name = "homeBtn"
                                addBtnRef(node, name)
                                return () => {
                                    delete btnRefs.current[name]
                                }
                            }}
                        >Home
                        </button>
                    </div>
                </>
            )
        } else {
            return (
                <button
                    onClick={handleCheckAnswer}
                    className="check-answer-btn"
                    ref={(node) => {
                        const name = "checkAnswerBtn"
                        addBtnRef(node, name)
                        return () => {
                            delete btnRefs.current[name]
                        }
                    }}
                >
                    Check answers
                </button>
            )
        }
    })


    // ---------
    // Functions
    // ---------
    function handleCheckAnswer() {
        clearInterval(timerRef.current) //STOP TIMER

        let tempScore = 0
        for (let i = 0; i < selectedAnswers.length; i++) {
            if (selectedAnswers[i] === questions.results[i].correct_answer) {
                tempScore++
            }
        }

        setScore(tempScore)
        setDisableRadio(true)
        setIsAnswerSubmitted(true)
    }

    function handleChangeAnswer(event, qIdx) {
        // Use event to get the value of answer
        // Use qIdx to know which question is it
        setSelectedAnswers((prevSelectedAnswers) => {
            const temp = [...prevSelectedAnswers]
            temp[qIdx] = event.target.value
            return temp
        })
    }

    async function handlePlayAgain() {

        // Disabled the btn
        for (let btnEl of Object.values(btnRefs.current)) {
            btnEl.disabled = true
        }
        const fetchedQuestions = await fetchQuestions(amount, difficulty, category, availableCategories)
        if (fetchedQuestions.response_code > 0) {
            console.log('Problems with fetching...')

        } else {
            console.log('Done fetching...')
            setQuestions(fetchedQuestions)
            resetGameState(fetchedQuestions.results.length)
        }

        // Enabled the btn
        for (let btnEl of Object.values(btnRefs.current)) {
            btnEl.disabled = false
        }
        setErrorCode(fetchedQuestions.response_code)
    }

    function resetGameState(numberOfQuestions) {
        setIsAnswerSubmitted(false)
        setIsForceSubmitted(false)
        setScore(-1)
        setSelectedAnswers(new Array(questions.results.length).fill(""))
        setDisableRadio(false)
        setTimeLeft(numberOfQuestions * timeGivenPerQuestions)
        const now = new Date()
        startTimer(now)
    }

    function startTimer(startTime) {
        const intervalId = setInterval(() => {
            setTimeLeft(initialTimeLeft - (new Date() - startTime))
        }, 100)
        timerRef.current = intervalId
    }


    // ------
    // Effect
    // ------

    // To start time upon loading
    useEffect(() => {
        if (!timerRef.current) {
            const now = new Date()
            startTimer(now)
        }
    }, [])

    // To scroll
    useEffect(() => {

        if (isAnswerSubmitted) {
            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: 'smooth'
            })
        } else {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            })
        }

    }, [isAnswerSubmitted, errorCode])

    // To render confetti
    useEffect(() => {
        if (score >= 0 && isWon && !isWinEffectAnimating) {
            winEffect()
        } else if (score >= 0 && !isWon && !isLoseEffectAnimating) {
            loseEffect()
        }
    }, [score, isWon])

    // ------
    // Return
    // ------ 

    return (
        <>
            <div id='rewardEl'></div>
            <h1>Quizzical</h1>
            <p className='subtitle bottom-subtitle'>Win by scoring more than 50% and within time of 5s per questions.</p>
            <div className='game-info-container'>
                <p>Difficulty: {difficulty[0].toUpperCase() + difficulty.slice(1)}</p>
                <p>Category: {category}</p>
            </div>
                <p className='timer'>Time: {timeLeftMinute}:{timeLeftSecond}</p>
            <section className='question-form'>
                <div className='question-form-inner'>
                    {questionElements}
                </div>
            </section>
            <div className='action-container'>
                {actionElements}
                {
                    errorCode > 0
                        ? <p className="error-msg">Error: {errorMsg[errorCode]}. Please try again.</p>
                        : <p className="error-msg"></p>
                }
            </div>

        </>
    )
}