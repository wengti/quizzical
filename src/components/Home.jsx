import { useState } from 'react'


export function Home(props){

    // Derived State
    const categories = props.categories
    const categorySelectElements = categories.map( (categoryObj) => {
        return (
            <option 
                key = {categoryObj.id}
                value={categoryObj.name}
            >
                {categoryObj.name}
            </option>
        )
    })

    // Determine error messages
    const errorMsg = ["Success", "No Results", "Invalid Parameter", "Token Not Found", "Token Empty", "Rate Limit"]


    return (
        <section className='home'>
            <h1>Quizzical</h1>
            <p>Explore the world of unknown through quizzes!</p>

            <form className='quiz-type-form' action={props.handleStart}>

                <label htmlFor='category'>Category: </label>
                <select 
                    id='category'
                    name='category'
                    required
                    defaultValue=""
                    >
                        <option value="" disabled>--- Please choose an option ---</option>
                        {categorySelectElements}
                        <option value="Mixed">Mixed</option>
                </select>
            

            
                <label htmlFor='numOfQuestions'>Number of Questions: </label>
                <input
                    id= 'numOfQuestions'
                    name= 'numOfQuestions'
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
                
                <button>Start quiz</button>
            </form>

            {
            props.questions.response_code > 0 
                && <p className="error-msg">Error: {errorMsg[props.questions.response_code]}. Please try again.</p>
            }
        </section>
    )
}