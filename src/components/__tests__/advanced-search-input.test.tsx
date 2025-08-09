import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdvancedSearchInput } from '../advanced-search-input';
import '@testing-library/jest-dom';

// Mock the lucide-react icons
jest.mock('lucide-react', () => ({
  Search: () => <div>SearchIcon</div>,
  X: () => <div>XIcon</div>,
  ChevronDown: () => <div>ChevronDownIcon</div>,
  ChevronLeft: () => <div>ChevronLeftIcon</div>,
  HelpCircle: () => <div>HelpCircleIcon</div>,
}));

describe('AdvancedSearchInput', () => {
  const mockOnChange = jest.fn();
  const mockOnSearch = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders search input with initial value', () => {
    render(
      <AdvancedSearchInput 
        value="test search" 
        onChange={mockOnChange} 
        onSearch={mockOnSearch} 
      />
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('test search');
  });

  it('calls onChange when input value changes', async () => {
    const user = userEvent.setup();
    render(
      <AdvancedSearchInput 
        value="" 
        onChange={mockOnChange} 
        onSearch={mockOnSearch} 
      />
    );
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'test');
    
    expect(mockOnChange).toHaveBeenCalledTimes(4); // 't', 'e', 's', 't'
    expect(mockOnChange).toHaveBeenLastCalledWith('t');
  });

  it('calls onSearch when form is submitted', async () => {
    const user = userEvent.setup();
    render(
      <AdvancedSearchInput 
        value="test" 
        onChange={mockOnChange} 
        onSearch={mockOnSearch} 
      />
    );
    
    const form = screen.getByRole('search');
    await user.click(screen.getByRole('button', { name: /جستجو/i }));
    
    expect(mockOnSearch).toHaveBeenCalledTimes(1);
    expect(mockOnSearch).toHaveBeenCalledWith('test');
  });

  it('calls onSearch when Enter key is pressed', async () => {
    const user = userEvent.setup();
    render(
      <AdvancedSearchInput 
        value="test" 
        onChange={mockOnChange} 
        onSearch={mockOnSearch} 
      />
    );
    
    const input = screen.getByRole('textbox');
    await user.type(input, '{enter}');
    
    expect(mockOnSearch).toHaveBeenCalledTimes(1);
    expect(mockOnSearch).toHaveBeenCalledWith('test');
  });

  it('clears input when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AdvancedSearchInput 
        value="test" 
        onChange={mockOnChange} 
        onSearch={mockOnSearch} 
      />
    );
    
    const clearButton = screen.getByRole('button', { name: /پاک کردن جستجو/i });
    await user.click(clearButton);
    
    expect(mockOnChange).toHaveBeenCalledWith('');
    expect(mockOnSearch).toHaveBeenCalledWith('');
  });

  it('toggles help tooltip when help button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AdvancedSearchInput 
        value="" 
        onChange={mockOnChange} 
        onSearch={mockOnSearch} 
      />
    );
    
    const helpButton = screen.getByRole('button', { name: /راهنمای جستجو/i });
    await user.click(helpButton);
    
    expect(screen.getByText('راهنمای جستجوی پیشرفته')).toBeInTheDocument();
  });

  it('inserts example when an example is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AdvancedSearchInput 
        value="" 
        onChange={mockOnChange} 
        onSearch={mockOnSearch} 
      />
    );
    
    console.log('1. Opening help tooltip...');
    const helpButton = screen.getByRole('button', { name: /راهنمای جستجو/i });
    await user.click(helpButton);
    
    // Verify the help tooltip is visible
    const helpTooltip = screen.getByText('راهنمای جستجوی پیشرفته');
    expect(helpTooltip).toBeInTheDocument();
    
    console.log('2. Finding AND example button...');
    // Find the button that contains both 'AND' and the example text
    const exampleButton = screen.getByRole('button', { 
      name: /AND.*جستجوی عبارات با هم/i 
    });
    
    console.log('3. Clicking on AND example button...');
    await user.click(exampleButton);
    
    console.log('4. Verifying onChange was called...');
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith('علی AND رضا');
    
    // Verify the tooltip is closed after selection
    console.log('5. Verifying tooltip is closed...');
    expect(screen.queryByText('راهنمای جستجوی پیشرفته')).not.toBeInTheDocument();
  });
});
