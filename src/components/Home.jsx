import { useRef } from 'react'


export function Home(props) {

    // Derived State
    const categories = props.categories
    const categorySelectElements = categories.map((categoryObj) => {
        return (
            <option
                key={categoryObj.id}
                value={categoryObj.name}
            >
                {categoryObj.name}
            </option>
        )
    })

    // Ref
    const btnRef = useRef(null)


    // function
    async function handleStart(formData) {
        const formAmount = formData.get('numOfQuestions')
        const formDifficulty = formData.get('difficulty')
        const formCategory = formData.get('category')

        btnRef.current.disabled = true
        const fetchedQuestions = await props.fetchQuestions(formAmount, formDifficulty, formCategory, categories)
        btnRef.current.disabled = false
        props.setQuestionsInHome(fetchedQuestions)
    }


    return (
        <section className='home'>
            <h1>Quizzical</h1>
            <p className='subtitle bottom-subtitle'>Win by scoring more than 50% and within time of 5s per questions.</p>

            <form className='quiz-type-form' action={handleStart}>

                <label htmlFor='category'>Category: </label>
                <select
                    id='category'
                    name='category'
                    required
                    defaultValue=""
                >
                    <option value="" disabled>--- Please choose an option ---</option>
                    <option value="Mixed">Mixed</option>
                    {categorySelectElements}
                </select>



                <label htmlFor='numOfQuestions'>Number of Questions: </label>
                <input
                    id='numOfQuestions'
                    name='numOfQuestions'
                    type='number'
                    defaultValue="5"
                    min="5"
                    max="10"
                    required
                />



                <label htmlFor='difficulty'>Difficulty: </label>
                <select
                    id='difficulty'
                    name='difficulty'
                    defaultValue=""
                    required
                >
                    <option value="" disabled>--- Please choose an option ---</option>
                    <option value='easy'>Easy</option>
                    <option value='medium'>Medium</option>
                    <option value='hard'>Hard</option>
                </select>

                <button disabled={categories.length <= 0} ref={btnRef}>Start quiz</button>
            </form>

            {
                props.questions.response_code > 0
                && <p className="error-msg">Error: {props.errorMsg[props.questions.response_code]}. Please try again.</p>
            }
        </section>
    )
}