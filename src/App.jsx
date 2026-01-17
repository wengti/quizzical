import { useState, useEffect } from 'react'
import { Home } from "./components/Home.jsx"
import { Quiz } from './components/Quiz.jsx'

export function App() {
    // State
    const [questions, setQuestions] = useState({ results: [] }) // questions is an object with a response code (int) and an result (arr)
    const [categories, setCategories] = useState([])

    // Derived State
    const isGameStart = questions.results.length > 0    // The game is considered started if the questions are populated

    // Static value
    // Determine error messages
    const errorMsg = ["Success", "No Results", "Invalid Parameter", "Token Not Found", "Token Empty", "Rate Limit"]

    // -----------------
    // Function for Home
    // -----------------

    async function fetchQuestions(inputAmount, inputDifficulty, inputCategory, availableCategories) {
        console.log('Fetching...')
        let apiUrl = ""
        let categoryId = null
        if (inputCategory != 'Mixed') {
            categoryId = availableCategories.filter((category) => {
                return category.name === inputCategory
            })[0].id
            apiUrl = `https://opentdb.com/api.php?amount=${inputAmount}&category=${categoryId}&difficulty=${inputDifficulty}`
        }
        else {
            apiUrl = `https://opentdb.com/api.php?amount=${inputAmount}&difficulty=${inputDifficulty}`
        }
        const res = await fetch(apiUrl)
        const data = await res.json()
        if (!res.ok) {
            console.log(data)
            return data
        }

        // Decide how to arrange answers to the data before setting
        data.results = data.results.map((entry) => {
            const randomIdx = Math.floor(Math.random() * (entry.incorrect_answers.length + 1))
            const answers = [...entry.incorrect_answers]
            answers.splice(randomIdx, 0, entry.correct_answer)
            entry.answers = answers
            return entry
        })

        return data
    }

    function setQuestionsInHome(data){
        setQuestions(data)
    }


    function handleHome(){
        setQuestions({ results: [] })
    }


    // ----------
    // Use Effect
    // ---------- 
    useEffect(() => {

        // Effect 1 - Load the categories
        if (categories.length === 0) {

            async function fetchCategories() {
                const res = await fetch("https://opentdb.com/api_category.php")
                const data = await res.json()
                if (!res.ok) {
                    throw new Error(`Fail to fetch categories.`)
                }
                setCategories(data.trivia_categories)
            }
            fetchCategories()
        }

    }, [categories])

    // ------
    // Return
    // ------
    return (
        <>
            {isGameStart
                ? <Quiz
                    questions={questions}
                    fetchQuestions={fetchQuestions}
                    categories={categories}
                    errorMsg={errorMsg}
                    handleHome={handleHome}
                />
                : <Home
                    fetchQuestions={fetchQuestions}
                    setQuestionsInHome={setQuestionsInHome}
                    questions={questions}
                    categories={categories}
                    errorMsg={errorMsg}
                />
            }
        </>
    )
}