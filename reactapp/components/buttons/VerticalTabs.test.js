import { render, screen, fireEvent } from '@testing-library/react';
import VerticalTabs from './VerticalTabs';

describe('VerticalTabs component', () => {
  const tabNames = ['Tab 1', 'Tab 2', 'Tab 3'];
  const mockChildren = [
    <div key="1">Content for Tab 1</div>,
    <div key="2">Content for Tab 2</div>,
    <div key="3">Content for Tab 3</div>,
  ];

  test('Renders tabs and contents', () => {
    render(
      <VerticalTabs tabNames={tabNames}>
        {mockChildren}
      </VerticalTabs>
    );

    // Check if all tabs and contents are rendered
    tabNames.forEach((tabName) => {
      const tabButton = screen.getByText(tabName);
      expect(tabButton).toBeInTheDocument();
      expect(tabButton).toHaveAttribute('role', 'tab');
    });

    mockChildren.forEach((content) => {
      // eslint-disable-next-line testing-library/no-node-access
      const contentText = content.props.children;
      const tabContent = screen.getByText(contentText);
      expect(tabContent).toBeInTheDocument();
    });
  });

  test('Switches active tab on click', () => {
    render(
      <VerticalTabs tabNames={tabNames}>
        {mockChildren}
      </VerticalTabs>
    );

    const secondTabButton = screen.getByText('Tab 2');

    // Click the second tab
    fireEvent.click(secondTabButton);

    // Check if the second tab is active
    expect(secondTabButton).toHaveClass('active');

    // Check if the content for the second tab is visible and others are hidden
    const contentForTab2 = screen.getByText('Content for Tab 2');
    expect(contentForTab2).toBeVisible();

    const contentForTab1 = screen.queryByText('Content for Tab 1');
    const contentForTab3 = screen.queryByText('Content for Tab 3');
    // Not having show and active means that the div is not visible.
    expect(contentForTab1).not.toHaveClass('show', 'active');
    expect(contentForTab3).not.toHaveClass('show', 'active');
  });
});
