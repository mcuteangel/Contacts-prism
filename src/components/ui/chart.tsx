"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

interface ChartContainerProps extends React.ComponentProps<"div"> {
  config: ChartConfig
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >["children"]
  variant?: 'default' | 'glass'
}

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ id, className, children, config, variant = 'default', ...props }, ref) => {
    const uniqueId = React.useId()
    const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

    return (
      <ChartContext.Provider value={{ config }}>
        <div
          data-chart={chartId}
          ref={ref}
          className={cn(
            "relative flex aspect-video justify-center text-xs overflow-hidden",
            "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground",
            "[&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/30",
            "[&_.recharts-curve.recharts-tooltip-cursor]:stroke-border/50",
            "[&_.recharts-dot[stroke='#fff']]:stroke-transparent",
            "[&_.recharts-layer]:outline-none",
            "[&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border/30",
            "[&_.recharts-radial-bar-background-sector]:fill-muted/50",
            "[&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted/20",
            "[&_.recharts-reference-line_[stroke='#ccc']]:stroke-border/50",
            "[&_.recharts-sector[stroke='#fff']]:stroke-transparent",
            "[&_.recharts-sector]:outline-none",
            "[&_.recharts-surface]:outline-none",
            variant === 'glass' && [
              "rounded-xl border border-border/30 bg-background/60 backdrop-blur-md",
              "shadow-lg [&_.recharts-cartesian-grid_horizontal]:[stroke-dasharray:3_3] [&_.recharts-cartesian-grid_vertical]:[stroke-dasharray:3_3]",
              "[&_.recharts-cartesian-axis-tick_text]:fill-foreground/80",
              "[&_.recharts-legend-item]:bg-background/50 [&_.recharts-legend-item]:px-3 [&_.recharts-legend-item]:py-1.5 [&_.recharts-legend-item]:rounded-full",
              "[&_.recharts-legend-item]:border [&_.recharts-legend-item]:border-border/30 [&_.recharts-legend-item]:shadow-sm",
              "[&_.recharts-legend-item_text]:text-foreground/80"
            ],
            className
          )}
          {...props}
        >
          <ChartStyle id={chartId} config={config} variant={variant} />
          <RechartsPrimitive.ResponsiveContainer>
            {children}
          </RechartsPrimitive.ResponsiveContainer>
        </div>
      </ChartContext.Provider>
    )
  }
)
ChartContainer.displayName = "Chart"

interface ChartStyleProps {
  id: string
  config: ChartConfig
  variant?: 'default' | 'glass'
}

const ChartStyle = ({ id, config, variant = 'default' }: ChartStyleProps) => {
  const colorConfig = Object.entries(config).filter(
    ([, config]) => config.theme || config.color
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  )
}

const ChartTooltip = React.forwardRef<
  any,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> & {
    variant?: 'default' | 'glass'
  }
>(({ variant = 'default', ...props }, ref) => {
  return (
    <RechartsPrimitive.Tooltip
      ref={ref}
      wrapperStyle={{
        backgroundColor: variant === 'glass' ? 'rgba(var(--background) / 0.8)' : '',
        backdropFilter: variant === 'glass' ? 'blur(12px)' : 'none',
        border: variant === 'glass' ? '1px solid rgba(var(--border) / 0.3)' : 'none',
        borderRadius: variant === 'glass' ? '0.5rem' : '0',
        boxShadow: variant === 'glass' ? '0 4px 30px rgba(0, 0, 0, 0.1)' : 'none',
        padding: variant === 'glass' ? '0.5rem' : '0',
      }}
      contentStyle={{
        backgroundColor: 'transparent',
        border: 'none',
        boxShadow: 'none',
      }}
      itemStyle={{
        padding: variant === 'glass' ? '0.25rem 0' : '0',
      }}
      labelStyle={{
        color: 'hsl(var(--foreground) / 0.9)',
        fontWeight: 500,
        marginBottom: variant === 'glass' ? '0.25rem' : '0',
      }}
      {...props}
    />
  )
})

interface ChartTooltipContentProps extends React.ComponentProps<"div"> {
  active?: boolean
  payload?: any[]
  name: string
  value: string | number
  color: string
  icon?: React.ReactNode
  variant?: 'default' | 'glass'
  label?: string | number
  labelFormatter?: (value: any, entries: any[]) => React.ReactNode
  formatter?: (value: any, name: string, entry: any, index: number, payload: any) => React.ReactNode
  labelClassName?: string
}

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  ChartTooltipContentProps & {
    hideLabel?: boolean
    hideIndicator?: boolean
    indicator?: "line" | "dot" | "dashed"
    nameKey?: string
    labelKey?: string
  }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
      variant = 'default',
    },
    ref
  ) => {
    const { config } = useChart()

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null
      }

      const [item] = payload
      const key = `${labelKey || item?.dataKey || item?.name || "value"}`
      const itemConfig = getPayloadConfigFromPayload(config, item, key)
      const value =
        !labelKey && typeof label === "string"
          ? config[label as keyof typeof config]?.label || label
          : itemConfig?.label

      if (labelFormatter) {
        return (
          <div className={cn("font-medium", labelClassName)}>
            {labelFormatter(value, payload)}
          </div>
        )
      }

      if (!value) {
        return null
      }

      return <div className={cn("font-medium", labelClassName)}>{value}</div>
    }, [
      label,
      labelFormatter,
      payload,
      hideLabel,
      labelClassName,
      config,
      labelKey,
    ])

    if (!active || !payload?.length) {
      return null
    }

    const nestLabel = payload.length === 1 && indicator !== "dot"

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          variant === 'glass' && "bg-background/80 backdrop-blur-sm",
          className
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload.map((item: {
            name?: string;
            dataKey?: string;
            color?: string;
            payload?: {
              fill?: string;
              [key: string]: any;
            };
            [key: string]: any;
          }, index: number) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const indicatorColor = color || item.payload?.fill || item.color

            return (
              <div
                key={item.dataKey}
                className={cn(
                  "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  indicator === "dot" && "items-center"
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                            {
                              "h-2.5 w-2.5": indicator === "dot",
                              "w-1": indicator === "line",
                              "w-0 border-[1.5px] border-dashed bg-transparent":
                                indicator === "dashed",
                              "my-0.5": nestLabel && indicator === "dashed",
                            }
                          )}
                          style={
                            {
                              "--color-bg": indicatorColor,
                              "--color-border": indicatorColor,
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        "flex flex-1 justify-between leading-none",
                        nestLabel ? "items-end" : "items-center"
                      )}
                    >
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-muted-foreground">
                          {itemConfig?.label || item.name}
                        </span>
                      </div>
                      {item.value && (
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {item.value.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltip"

interface ChartLegendContentProps extends React.ComponentProps<"div"> {
  payload: Array<{
    value: string
    color: string
    icon?: React.ReactNode
  }>
  config: ChartConfig
  onLegendClick?: (key: string) => void
  activeKeys?: string[]
  inactiveKeys?: string[]
  variant?: 'default' | 'glass'
}

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  ChartLegendContentProps
>(
  (
    { className, payload, variant = 'default' },
    ref
  ) => {
    const { config } = useChart()

    if (!payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-wrap justify-center gap-2",
          variant === 'glass' && "p-2 bg-background/30 backdrop-blur-sm rounded-xl",
          className
        )}
      >
        {payload.map((item) => {
          const key = `${item.value || "value"}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)

          return (
            <div
              key={item.value}
              className={cn(
                "flex items-center gap-2 [&>svg]:h-4 [&>svg]:w-4",
                variant === 'glass' 
                  ? "[&>svg]:text-foreground/80" 
                  : "[&>svg]:text-muted-foreground",
                className
              )}
            >
              {itemConfig?.icon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          )
        })}
      </div>
    )
  }
)
ChartLegendContent.displayName = "ChartLegend"

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== "object" || payload === null) {
    return undefined
  }

  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey: string = key

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === "string"
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config]
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegendContent as ChartLegend,
  ChartStyle,
}
