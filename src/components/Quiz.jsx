import { useState, useMemo, useRef, useEffect } from 'react'
import { decode } from 'html-entities'
import { clsx } from 'clsx'

export function Quiz({ questions: appQuestions, fetchQuestions, categories: availableCategories, errorMsg, handleHome}) {

    // State
    const [questions, setQuestions] = useState(appQuestions)
    const [selectedAnswers, setSelectedAnswers] = useState(() => new Array(questions.results.length).fill(""))
    const [score, setScore] = useState(-1)
    const [disableRadio, setDisableRadio] = useState(false) //Freeze button when loading
    const [errorCode, setErrorCode] = useState(0)
    const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false)

    // Ref
    const btnRefs = useRef({})

    function addBtnRef(node, name) {
        btnRefs.current[name] = node
    }

    const errorMsgEl = useRef(null)


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
            return (
                <>
                    <p className='score-msg'>You scored {score}/{questions.results.length} correct answers</p>
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


    function handleCheckAnswer() {
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
        // Deduce the game config from the current questions
        const amount = questions.results.length
        const difficulty = questions.results[0].difficulty
        const uniqueCategory = [...new Set(questions.results.map(result => result.category))]
        const category = uniqueCategory.length > 1
            ? "Mixed"
            : uniqueCategory[0]

        // Disabled the btn
        for (let btnEl of Object.values(btnRefs.current)) {
            btnEl.disabled = true
        }
        const fetchedQuestions = await fetchQuestions(amount, difficulty, category, availableCategories)
        if (fetchedQuestions.response_code > 0) {
            console.log('Problems with fetching...')
            console.log(errorMsgEl.current)

        } else {
            console.log('Done fetching...')
            setQuestions(fetchedQuestions)
            resetGameState()
        }

        // Enabled the btn
        for (let btnEl of Object.values(btnRefs.current)) {
            btnEl.disabled = false
        }
        setErrorCode(fetchedQuestions.response_code)
    }

    function resetGameState() {
        setIsAnswerSubmitted(false)
        setScore(-1)
        setSelectedAnswers(new Array(questions.results.length).fill(""))
        setDisableRadio(false)
    }



    // ------
    // Effect
    // ------
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

    return (
        <>
            <h1>Quizzical</h1>
            <p>Explore the world of unknown through quizzes!</p>
            <section className='question-form'>
                <div className='question-form-inner'>
                    {questionElements}
                </div>
            </section>
            <div className='action-container'>
                {actionElements}
                {
                    errorCode > 0
                        ? <p className="error-msg" ref={errorMsgEl}>Error: {errorMsg[errorCode]}. Please try again.</p>
                        : <p className="error-msg" ref={errorMsgEl}></p>
                }
            </div>

        </>
    )
}