// 临时类型声明，后续 antd 类型解析正常后可移除
declare module 'antd' {
  import type { CSSProperties, ReactNode, ComponentType } from 'react'

  export interface ConfigProviderProps {
    locale?: any
    theme?: any
    children?: ReactNode
  }
  export const ConfigProvider: ComponentType<ConfigProviderProps> & {
    ConfigContext: any
  }

  export interface ButtonProps {
    type?: 'primary' | 'default' | 'dashed' | 'link' | 'text'
    htmlType?: 'button' | 'submit' | 'reset'
    size?: 'large' | 'middle' | 'small'
    block?: boolean
    danger?: boolean
    icon?: ReactNode
    loading?: boolean
    onClick?: () => void
    children?: ReactNode
    className?: string
  }
  export const Button: ComponentType<ButtonProps>

  export interface InputProps {
    prefix?: ReactNode
    placeholder?: string
    size?: 'large' | 'middle' | 'small'
    value?: string
    onChange?: (e: any) => void
    className?: string
  }
  export const Input: ComponentType<InputProps> & {
    Password: ComponentType<InputProps>
  }

  export interface FormProps {
    layout?: 'horizontal' | 'vertical' | 'inline'
    children?: ReactNode
    className?: string
  }
  export const Form: ComponentType<FormProps> & {
    Item: ComponentType<{
      label?: string
      name?: string
      rules?: any[]
      children?: ReactNode
      className?: string
    }>
    useForm: () => any[]
  }

  export interface CardProps {
    title?: string
    className?: string
    children?: ReactNode
    style?: CSSProperties
  }
  export const Card: ComponentType<CardProps>

  export interface SpinProps {
    size?: 'small' | 'default' | 'large'
    className?: string
    children?: ReactNode
    fullscreen?: boolean
  }
  export const Spin: ComponentType<SpinProps>

  export interface ResultProps {
    status?: 'success' | 'error' | 'info' | 'warning' | '404' | '403' | '500'
    title?: string
    subTitle?: string
    extra?: ReactNode
  }
  export const Result: ComponentType<ResultProps>

  export interface TypographyTitleProps {
    level?: 1 | 2 | 3 | 4 | 5
    className?: string
    children?: ReactNode
  }
  export const Typography: {
    Title: ComponentType<TypographyTitleProps>
    Text: ComponentType<any>
    Paragraph: ComponentType<any>
  }

  export interface LayoutProps {
    style?: CSSProperties
    className?: string
    children?: ReactNode
  }
  export const Layout: ComponentType<LayoutProps> & {
    Sider: ComponentType<{
      collapsible?: boolean
      collapsed?: boolean
      onCollapse?: (collapsed: boolean) => void
      width?: number
      theme?: 'light' | 'dark'
      children?: ReactNode
      style?: CSSProperties
    }>
    Content: ComponentType<{ className?: string; children?: ReactNode; style?: CSSProperties }>
    Header: ComponentType<any>
    Footer: ComponentType<any>
  }

  export interface MenuProps {
    theme?: 'light' | 'dark'
    mode?: 'vertical' | 'horizontal' | 'inline'
    items?: any[]
    onClick?: (info: { key: string }) => void
    className?: string
  }
  export const Menu: ComponentType<MenuProps>

  export interface StatisticProps {
    title?: string
    value?: number | string
    prefix?: ReactNode
    suffix?: ReactNode
  }
  export const Statistic: ComponentType<StatisticProps>

  export interface RowProps {
    gutter?: number | [number, number]
    children?: ReactNode
  }
  export const Row: ComponentType<RowProps>
  export const Col: ComponentType<{ span?: number; children?: ReactNode }>

  export interface BadgeProps {
    count?: number
    dot?: boolean
    children?: ReactNode
    overflowCount?: number
    size?: 'default' | 'small'
  }
  export const Badge: ComponentType<BadgeProps>

  export interface DropdownProps {
    menu?: { items: any[] }
    children?: ReactNode
  }
  export const Dropdown: ComponentType<DropdownProps>

  export interface AvatarProps {
    src?: string
    size?: number | 'small' | 'default' | 'large'
    alt?: string
    children?: ReactNode
  }
  export const Avatar: ComponentType<AvatarProps>

  export interface ImageProps {
    src?: string
    alt?: string
    width?: number | string
    height?: number | string
    preview?: boolean
    fallback?: string
    className?: string
  }
  export const Image: ComponentType<ImageProps>

  export interface SpaceProps {
    size?: number | 'small' | 'middle' | 'large'
    direction?: 'vertical' | 'horizontal'
    children?: ReactNode
  }
  export const Space: ComponentType<SpaceProps>

  export interface TabsProps {
    items?: any[]
    activeKey?: string
    onChange?: (key: string) => void
    children?: ReactNode
  }
  export const Tabs: ComponentType<TabsProps> & {
    TabPane: ComponentType<any>
  }

  export interface TableProps {
    columns?: any[]
    dataSource?: any[]
    rowKey?: string | ((record: any) => string)
    loading?: boolean
    pagination?: any
    onChange?: (pagination: any, filters: any, sorter: any) => void
  }
  export const Table: ComponentType<TableProps>

  export interface TagProps {
    color?: string
    children?: ReactNode
    closable?: boolean
    onClose?: () => void
  }
  export const Tag: ComponentType<TagProps>

  export interface ModalProps {
    title?: string
    open?: boolean
    onOk?: () => void
    onCancel?: () => void
    children?: ReactNode
    footer?: ReactNode
    width?: number | string
    confirmLoading?: boolean
  }
  export const Modal: ComponentType<ModalProps> & {
    confirm: (config: any) => void
    info: (config: any) => void
    success: (config: any) => void
    error: (config: any) => void
    warning: (config: any) => void
  }

  export interface UploadProps {
    action?: string
    headers?: Record<string, string>
    name?: string
    multiple?: boolean
    onChange?: (info: any) => void
    beforeUpload?: (file: File, fileList: File[]) => boolean | Promise<File>
    children?: ReactNode
    showUploadList?: boolean
  }
  export const Upload: ComponentType<UploadProps>

  export interface SelectProps {
    value?: string | number
    onChange?: (value: any) => void
    placeholder?: string
    options?: { label: string; value: string | number }[]
    mode?: 'multiple' | 'tags'
    allowClear?: boolean
    showSearch?: boolean
    className?: string
  }
  export const Select: ComponentType<SelectProps>

  export interface PaginationProps {
    current?: number
    total?: number
    pageSize?: number
    onChange?: (page: number, pageSize: number) => void
    showSizeChanger?: boolean
    showTotal?: (total: number, range: [number, number]) => string
  }
  export const Pagination: ComponentType<PaginationProps>

  export interface TooltipProps {
    title?: string
    children?: ReactNode
  }
  export const Tooltip: ComponentType<TooltipProps>

  export interface PopoverProps {
    content?: ReactNode
    title?: string
    trigger?: 'hover' | 'click' | 'focus'
    children?: ReactNode
  }
  export const Popover: ComponentType<PopoverProps>

  export interface ProgressProps {
    percent?: number
    status?: 'success' | 'exception' | 'normal' | 'active'
    size?: 'small' | 'default'
    format?: (percent: number) => string
  }
  export const Progress: ComponentType<ProgressProps>

  export interface SkeletonProps {
    active?: boolean
    loading?: boolean
    children?: ReactNode
  }
  export const Skeleton: ComponentType<SkeletonProps>

  export interface EmptyProps {
    description?: string
    image?: ReactNode
    children?: ReactNode
  }
  export const Empty: ComponentType<EmptyProps>

  export interface SwitchProps {
    checked?: boolean
    onChange?: (checked: boolean) => void
    size?: 'default' | 'small'
  }
  export const Switch: ComponentType<SwitchProps>

  export interface RadioGroupProps {
    value?: any
    onChange?: (e: any) => void
    options?: any[]
    children?: ReactNode
  }
  export const Radio: ComponentType<any> & {
    Group: ComponentType<RadioGroupProps>
    Button: ComponentType<any>
  }

  export interface CheckboxProps {
    checked?: boolean
    onChange?: (e: any) => void
    children?: ReactNode
  }
  export const Checkbox: ComponentType<CheckboxProps>

  export interface DatePickerProps {
    value?: any
    onChange?: (date: any, dateString: string) => void
    placeholder?: string
  }
  export const DatePicker: ComponentType<DatePickerProps>

  export interface CarouselProps {
    autoplay?: boolean
    children?: ReactNode
  }
  export const Carousel: ComponentType<CarouselProps>

  export interface BreadcrumbProps {
    items?: { title: string }[]
  }
  export const Breadcrumb: ComponentType<BreadcrumbProps>

  export const message: {
    success: (msg: string) => void
    error: (msg: string) => void
    warning: (msg: string) => void
    info: (msg: string) => void
  }
}

declare module 'antd/locale/zh_CN' {
  const locale: any
  export default locale
}

declare module '@ant-design/icons' {
  import type { ComponentType } from 'react'
  export const UserOutlined: ComponentType<{ className?: string }>
  export const LockOutlined: ComponentType<{ className?: string }>
  export const DashboardOutlined: ComponentType<{ className?: string }>
  export const PlaySquareOutlined: ComponentType<{ className?: string }>
  export const FileTextOutlined: ComponentType<{ className?: string }>
  export const SettingOutlined: ComponentType<{ className?: string }>
  export const VideoCameraOutlined: ComponentType<{ className?: string }>
  export const EyeOutlined: ComponentType<{ className?: string }>
  export const BellOutlined: ComponentType<{ className?: string }>
  export const SearchOutlined: ComponentType<{ className?: string }>
  export const HeartOutlined: ComponentType<{ className?: string }>
  export const StarOutlined: ComponentType<{ className?: string }>
  export const ShareAltOutlined: ComponentType<{ className?: string }>
  export const MoreOutlined: ComponentType<{ className?: string }>
  export const CloseOutlined: ComponentType<{ className?: string }>
  export const CheckOutlined: ComponentType<{ className?: string }>
  export const LeftOutlined: ComponentType<{ className?: string }>
  export const RightOutlined: ComponentType<{ className?: string }>
  export const UpOutlined: ComponentType<{ className?: string }>
  export const DownOutlined: ComponentType<{ className?: string }>
  export const LoadingOutlined: ComponentType<{ className?: string }>
  export const SendOutlined: ComponentType<{ className?: string }>
  export const PictureOutlined: ComponentType<{ className?: string }>
  export const SmileOutlined: ComponentType<{ className?: string }>
  export const DeleteOutlined: ComponentType<{ className?: string }>
  export const EditOutlined: ComponentType<{ className?: string }>
  export const ExclamationCircleOutlined: ComponentType<{ className?: string }>
}
