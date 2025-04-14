import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Home from '../page'
import { generateRecipe } from '@/ai/flows/generate-recipe'

// Mock toast functionality
jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn(),
}))

describe('Home Page', () => {
  it('renders the home page correctly', () => {
    render(<Home />)
    
    // Check that the title is present
    expect(screen.getByText('Fridge Chef')).toBeInTheDocument()
    
    // Check for feature cards
    expect(screen.getByText('Single Recipe Generator')).toBeInTheDocument()
    expect(screen.getByText('Multiple Recipe Generator')).toBeInTheDocument()
    expect(screen.getByText('Recipe Improvement Lab')).toBeInTheDocument()
    
    // Check for ingredient input section
    expect(screen.getByText('Enter Ingredients:')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g., chicken, rice, broccoli')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Generate Recipe' })).toBeInTheDocument()
  })

  it('generates a recipe when the form is submitted with ingredients', async () => {
    render(<Home />)
    
    // Enter ingredients
    fireEvent.change(screen.getByPlaceholderText('e.g., chicken, rice, broccoli'), {
      target: { value: 'chicken, rice' },
    })
    
    // Click the generate button
    fireEvent.click(screen.getByRole('button', { name: 'Generate Recipe' }))
    
    // Wait for the recipe to be displayed
    await waitFor(() => {
      expect(screen.getByText('Test Recipe')).toBeInTheDocument()
    })
    
    // Check that the recipe content appears
    expect(screen.getByText('Ingredients:')).toBeInTheDocument()
    expect(screen.getByText('Ingredient 1')).toBeInTheDocument()
    expect(screen.getByText('Ingredient 2')).toBeInTheDocument()
    expect(screen.getByText('Instructions:')).toBeInTheDocument()
    
    // Verify that the AI function was called with the correct parameters
    expect(generateRecipe).toHaveBeenCalledWith({ ingredients: 'chicken, rice' })
  })

  it('resets the form when reset button is clicked', () => {
    render(<Home />)
    
    // Enter ingredients
    const inputElement = screen.getByPlaceholderText('e.g., chicken, rice, broccoli')
    fireEvent.change(inputElement, {
      target: { value: 'chicken, rice' },
    })
    
    // Verify the value is entered
    expect(inputElement).toHaveValue('chicken, rice')
    
    // Click the reset button
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    
    // Verify the form has been reset
    expect(inputElement).toHaveValue('')
  })
})