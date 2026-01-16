import { useState, useMemo } from 'react'
import {decode} from 'html-entities'

export function Quiz(props) {


    const [selectedAnswers, setSelectedAnswers] = useState([])
    const [count, setCount] = useState(0)


    // useMemo so it doesnt simply get re-rendered every single time
    const questionElements = useMemo(() => {

        const entries = props.questions.results
        return entries.map((entry, qIdx) => {

            const answersElements = entry.answers.map((answer, aIdx) => {

                const answerId = `q${qIdx}a${aIdx}`
                return (
                    <div key={answerId}>
                        <input
                            type='radio'
                            id={answerId}
                            value={answer}
                            onChange={(event) => handleChangeAnswer(event, qIdx)}
                        />
                        <label htmlFor={answerId}>{decode(answer)}</label>
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
    }, [])


    function handleCheckAnswer(event) {
        event.preventDefault()
        console.log("A new answer is selected")
    }

    function handleChangeAnswer(event, qIdx) {
        // Use event to get the value of answer
        // Use qIdx to know which question is it
        console.log(count)
        setCount(prevCount => prevCount + 1)
    }

    return (
        <section className='question-form'>
            {questionElements}
            <button onClick={handleCheckAnswer} className="check-answer-btn">Check answers</button>
        </section>
    )
}